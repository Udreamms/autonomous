
// src/helpers/kanban.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

export async function handleKanbanUpdate(from: string, contactName: string, body: string, source: string = 'whatsapp'): Promise<any> {
    // 1. Buscamos si ya existe una tarjeta con este número (FUERA de la transacción)
    // Firestore no permite collectionGroup dentro de runTransaction
    let cardsRef = db.collectionGroup('cards').where('contactNumber', '==', from);
    let existingCardSnapshot = await cardsRef.get();

    if (existingCardSnapshot.empty) {
        const alternativeFrom = from.startsWith('+') ? from.substring(1) : `+${from}`;
        const altCardsRef = db.collectionGroup('cards').where('contactNumber', '==', alternativeFrom);
        existingCardSnapshot = await altCardsRef.get();
    }

    // NEW: Robust Check using 'contactNumberClean' (for formatted numbers like +593 99...)
    if (existingCardSnapshot.empty) {
        // from is usually digits only (e.g. 59399...)
        const cleanRef = db.collectionGroup('cards').where('contactNumberClean', '==', from);
        existingCardSnapshot = await cleanRef.get();
    }

    // Devolvemos el resultado de la transacción
    return db.runTransaction(async (transaction) => {
        if (!existingCardSnapshot.empty) {
            // --- CASO 1: LA TARJETA YA EXISTE ---
            const cardDoc = existingCardSnapshot.docs[0];
            const cardRef = cardDoc.ref;

            // Re-leemos el documento dentro de la transacción para consistencia
            const freshSnap = await transaction.get(cardRef);
            if (!freshSnap.exists) return null; // Por si se borró en el milisegundo intermedio

            functions.logger.info(`[Transaction] Updating existing card for ${from}.`);

            const updateData = {
                lastMessage: body,
                source: source,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                contactNumberClean: from, // Self-healing: Ensure clean number is stored
                messages: admin.firestore.FieldValue.arrayUnion({
                    sender: 'user', text: body, timestamp: new Date(),
                }),
            };

            transaction.update(cardRef, updateData);

            const currentData = freshSnap.data() || {};
            const parentGroup = cardRef.parent.parent;
            const groupId = parentGroup ? parentGroup.id : null;

            return {
                ...currentData,
                id: freshSnap.id,
                groupId: groupId,
                lastMessage: body,
                source: source,
                isNew: false
            };

        } else {
            // --- CASO 2: CREAR NUEVA TARJETA ---
            functions.logger.info(`[Transaction] Creating new card for ${from}.`);

            const groupsRef = db.collection('kanban-groups');
            const inboxGroupQuery = groupsRef.where('name', '==', 'Bandeja de Entrada').limit(1);
            const inboxGroupSnapshot = await transaction.get(inboxGroupQuery);

            let groupId;
            if (!inboxGroupSnapshot.empty) {
                groupId = inboxGroupSnapshot.docs[0].id;
            } else {
                const anyGroupQuery = groupsRef.orderBy('order').limit(1);
                const anyGroupSnapshot = await transaction.get(anyGroupQuery);
                if (anyGroupSnapshot.empty) throw new Error('No groups found.');
                groupId = anyGroupSnapshot.docs[0].id;
            }

            const newCardRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc();
            const newCardData = {
                contactName,
                contactNumber: from,
                contactNumberClean: from, // Store clean number for future matches
                lastMessage: body,
                source: source,
                groupId: groupId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                messages: [{
                    sender: 'user',
                    text: body,
                    timestamp: new Date(),
                    type: body.startsWith('[') && body.endsWith(']') ? 'system' : 'text'
                }],
            };

            transaction.set(newCardRef, newCardData);

            return {
                ...newCardData,
                id: newCardRef.id,
                isNew: true
            };
        }
    });
}

// NUEVA FUNCIÓN PARA ACTUALIZAR ESTADO DE LECTURA
export async function updateReadStatus(recipientId: string): Promise<void> {
    const cardsRef = db.collectionGroup('cards').where('contactNumber', '==', recipientId);
    const snapshot = await cardsRef.get();

    if (!snapshot.empty) {
        // Marcamos la hora exacta en la que el usuario leyó el último mensaje
        await snapshot.docs[0].ref.update({
            lastReadAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info(`[Read Receipt] Updated lastReadAt for ${recipientId}`);
    }
}
