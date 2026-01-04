import React from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';

function DeleteConfirmDialog({ open, onConfirm, onCancel, scheduleName }) {
    return (
        <Dialog open={open} onOpenChange={(e, data) => !data.open && onCancel()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Warning24Regular style={{ color: '#d32f2f' }} />
                            Delete Class Schedule
                        </div>
                    </DialogTitle>
                    <DialogContent>
                        <p>
                            Are you sure you want to delete <strong>{scheduleName}</strong>?
                        </p>
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                            This action cannot be undone.
                        </p>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            appearance="primary"
                            style={{ backgroundColor: '#d32f2f' }}
                            onClick={onConfirm}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

export default DeleteConfirmDialog;
