import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'

function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [highContrast, setHighContrast] = useState(false)
    const [voiceOver, setVoiceOver] = useState(false)

    useEffect(() => {
        // Retrieve settings from localStorage when the component mounts
        const savedHighContrast = localStorage.getItem('highContrast') === 'true';
        const savedVoiceOver = localStorage.getItem('voiceOver') === 'true';
        setHighContrast(savedHighContrast);
        setVoiceOver(savedVoiceOver);
    }, []);

    useEffect(() => {
        if (!open) {
            // Reset to saved settings when the dialog is closed without saving
            const savedHighContrast = localStorage.getItem('highContrast') === 'true';
            const savedVoiceOver = localStorage.getItem('voiceOver') === 'true';
            setHighContrast(savedHighContrast);
            setVoiceOver(savedVoiceOver);
        }
    }, [open]);

    const handleSettingsSave = () => {
        // Save settings to localStorage
        localStorage.setItem('highContrast', highContrast.toString());
        localStorage.setItem('voiceOver', voiceOver.toString());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
                    <DialogDescription>
                        Make changes to your setting here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="high-contrast"
                                checked={highContrast}
                                onCheckedChange={setHighContrast}
                            />
                            <Label htmlFor="high-contrast" className="text-base">High Contrast</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                id="voice-over"
                                checked={voiceOver}
                                onCheckedChange={setVoiceOver}
                            />
                            <Label htmlFor="voice-over" className="text-base">VoiceOver</Label>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSettingsSave}>Save changes</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SettingsDialog;