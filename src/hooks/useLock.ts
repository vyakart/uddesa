import { useState, useEffect } from 'react';

export const useLock = (diaryId: string) => {
    const [isLocked, setIsLocked] = useState(false);
    const [showUnlock, setShowUnlock] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);

    useEffect(() => {
        const storedPass = localStorage.getItem(`diary_lock_${diaryId}`);
        if (storedPass) {
            setHasPasskey(true);
            setIsLocked(true); // Auto-lock if passkey exists
        }
    }, [diaryId]);

    const setPasskey = (pass: string) => {
        localStorage.setItem(`diary_lock_${diaryId}`, pass);
        setHasPasskey(true);
        setIsLocked(true);
    };

    const unlock = (pass: string) => {
        const storedPass = localStorage.getItem(`diary_lock_${diaryId}`);
        if (pass === storedPass) {
            setIsLocked(false);
            setShowUnlock(false);
            return true;
        }
        return false;
    };

    const removeLock = () => {
        localStorage.removeItem(`diary_lock_${diaryId}`);
        setHasPasskey(false);
        setIsLocked(false);
    };

    return {
        isLocked,
        showUnlock,
        hasPasskey,
        setShowUnlock,
        setPasskey,
        unlock,
        removeLock
    };
};
