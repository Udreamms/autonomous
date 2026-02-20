import { useState, useEffect, useCallback } from "react";
import { WebProject } from "../types";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    writeBatch
} from "firebase/firestore";

export const useProjects = (initialFiles: Record<string, string>) => {
    const [projects, setProjects] = useState<WebProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Initial Load active project from localStorage (Safe for Hydration)
    useEffect(() => {
        const savedId = localStorage.getItem('web-builder-active-project');
        if (savedId) {
            setActiveProjectId(savedId);
        }
    }, []);

    // Initial Load & Real-time Sync
    useEffect(() => {
        const q = query(collection(db, "web-projects"), orderBy("lastModified", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as WebProject));
            setProjects(projectsData);
        });

        return () => unsubscribe();
    }, []);

    // Persist active project ID
    useEffect(() => {
        if (activeProjectId) {
            localStorage.setItem('web-builder-active-project', activeProjectId);
        } else {
            localStorage.removeItem('web-builder-active-project');
        }
    }, [activeProjectId]);

    const handleNewProject = useCallback(async (name: string) => {
        if (!name) return;

        try {
            const newProject = {
                name,
                createdAt: Date.now(),
                lastModified: Date.now(),
                repoUrl: '',
                previewUrl: ''
            };

            const docRef = await addDoc(collection(db, "web-projects"), newProject);
            const projectId = docRef.id;

            // Initialize files in Firestore
            const batch = writeBatch(db);
            Object.entries(initialFiles).forEach(([path, content]) => {
                const fileRef = doc(db, "web-projects", projectId, "files", encodeURIComponent(path).replace(/\./g, '%2E'));
                batch.set(fileRef, {
                    path,
                    content,
                    updatedAt: Date.now()
                });
            });
            await batch.commit();

            setActiveProjectId(projectId);
            return projectId;
        } catch (e) {
            console.error("Failed to create project with files", e);
        }
    }, [initialFiles]);

    const handleSwitchProject = useCallback((id: string) => {
        setActiveProjectId(id);
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        try {
            await deleteDoc(doc(db, "web-projects", id));
            if (activeProjectId === id) setActiveProjectId(null);
        } catch (e) {
            console.error("Failed to delete project", e);
        }
    }, [activeProjectId]);

    const updateProjectLastModified = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update lastModified", e);
        }
    }, []);

    const updateProjectRepo = useCallback(async (id: string, repoUrl: string) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                repoUrl,
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update repoUrl", e);
        }
    }, []);

    const updateProject = useCallback(async (id: string, updates: Partial<WebProject>) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                ...updates,
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update project metadata", e);
        }
    }, []);

    const activeProject = projects.find(p => p.id === activeProjectId);

    return {
        projects,
        setProjects,
        activeProjectId,
        activeProject,
        handleNewProject,
        handleSwitchProject,
        deleteProject,
        updateProjectLastModified,
        updateProjectRepo,
        updateProject
    };
};
