import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Input,
    Label,
    makeStyles,
    shorthands,
    Field,
    Textarea,
    Checkbox
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
    content: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        minWidth: '500px'
    },
    formRow: {
        display: 'flex',
        ...shorthands.gap('12px'),
        alignItems: 'flex-start'
    },
    formField: {
        flex: 1
    },
    daysContainer: {
        display: 'flex',
        ...shorthands.gap('8px'),
        flexWrap: 'wrap',
        ...shorthands.padding('8px', '0')
    },
    dayCheckbox: {
        minWidth: '60px'
    },
    colorPicker: {
        width: '100%',
        height: '40px',
        cursor: 'pointer',
        ...shorthands.border('1px', 'solid', '#ccc'),
        borderRadius: '4px'
    },
    errorText: {
        color: '#d32f2f',
        fontSize: '12px',
        marginTop: '4px'
    }
});

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_COLORS = [
    '#0078d4', // Blue
    '#107c10', // Green
    '#d83b01', // Orange/Red
    '#9c27b0', // Purple
    '#e91e63', // Pink
    '#00acc1', // Cyan
    '#ff5722'  // Deep Orange
];

function ScheduleModal({ open, onClose, onSave, initialData = null, mode = 'create' }) {
    const styles = useStyles();

    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        course: '',
        section: '',
        room: '',
        days: [],
        startTime: '',
        endTime: '',
        color: DEFAULT_COLORS[0],
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with data when editing
    useEffect(() => {
        if (initialData && mode === 'edit') {
            // Normalize days to remove any stray asterisks
            const normalizedDays = (initialData.days || []).map(d => String(d).replace(/\*/g, '').trim());
            setFormData({
                name: initialData.name || '',
                course: initialData.course || '',
                course_id: initialData.course_id || initialData.courseId || null,
                section: initialData.section || '',
                section_id: initialData.section_id || initialData.sectionId || null,
                room: initialData.room || '',
                days: normalizedDays,
                startTime: initialData.startTime || '',
                endTime: initialData.endTime || '',
                color: initialData.color || DEFAULT_COLORS[0],
                isActive: initialData.isActive !== undefined ? initialData.isActive : true
            });
        } else {
            // Reset form when creating new
            setFormData({
                name: '',
                course: '',
                section: '',
                room: '',
                days: [],
                startTime: '',
                endTime: '',
                color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
                isActive: true
            });
        }
        setErrors({});
    }, [initialData, mode, open]);

    // Load reference data (courses & sections)
    useEffect(() => {
        let mounted = true;
        const loadRefs = async () => {
            try {
                const { fetchCourses, fetchSections } = await import('../../../services/supabase/referenceData');
                const [coursesRes, sectionsRes] = await Promise.all([fetchCourses(), fetchSections()]);
                if (!mounted) return;
                setCourses(coursesRes.success ? coursesRes.data : []);
                setSections(sectionsRes.success ? sectionsRes.data : []);
            } catch (err) {
                console.error('Error loading reference data:', err);
            }
        };

        if (open) loadRefs();
        return () => { mounted = false; };
    }, [open]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleDayToggle = (day) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
        if (errors.days) {
            setErrors(prev => ({ ...prev, days: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.name.trim()) {
            newErrors.name = 'Class name is required';
        }
        if (!formData.room.trim()) {
            newErrors.room = 'Room is required';
        }
        if (formData.days.length === 0) {
            newErrors.days = 'Select at least one day';
        }
        if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
        }
        if (!formData.endTime) {
            newErrors.endTime = 'End time is required';
        }

        // Time validation
        if (formData.startTime && formData.endTime) {
            if (formData.startTime >= formData.endTime) {
                newErrors.endTime = 'End time must be after start time';
            }
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);

        try {
                // Sanitize days before saving (remove any asterisks/trailing whitespace)
                const payload = { ...formData, days: (formData.days || []).map(d => String(d).replace(/\*/g, '').trim()) };
                await onSave(payload);
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to save schedule' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            course: '',
            course_id: null,
            section: '',
            section_id: null,
            room: '',
            days: [],
            startTime: '',
            endTime: '',
            color: DEFAULT_COLORS[0],
            isActive: true
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(e, data) => data.open ? null : handleClose()}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle
                        action={
                            <Button
                                appearance="subtle"
                                icon={<Dismiss24Regular />}
                                onClick={handleClose}
                            />
                        }
                    >
                        {mode === 'edit' ? 'Edit Class Schedule' : 'Add New Class Schedule'}
                    </DialogTitle>

                    <DialogContent className={styles.content}>
                        {/* Class Name */}
                        <Field
                            label="Class Name"
                            required
                            validationMessage={errors.name}
                            validationState={errors.name ? 'error' : undefined}
                        >
                            <Input
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g., Modeling and Simulation"
                            />
                        </Field>

                        {/* Course & Section (populated from Admin reference data) */}
                        <div className={styles.formRow}>
                            <Field label="Course" className={styles.formField}>
                                <select
                                    value={formData.course_id || ''}
                                    onChange={(e) => {
                                        const id = e.target.value || '';
                                        const selected = courses.find(c => c.id === id);
                                        handleChange('course_id', id || null);
                                        handleChange('course', selected ? selected.course_code : '');
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                                >
                                    <option value="">-- Select Course --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.course_code} {c.description ? `- ${c.description}` : ''}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Section" className={styles.formField}>
                                <select
                                    value={formData.section_id || ''}
                                    onChange={(e) => {
                                        const id = e.target.value || '';
                                        const selected = sections.find(s => s.id === id);
                                        handleChange('section_id', id || null);
                                        handleChange('section', selected ? selected.name : '');
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                                >
                                    <option value="">-- Select Section --</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        {/* Room */}
                        <Field
                            label="Room/Location"
                            required
                            validationMessage={errors.room}
                            validationState={errors.room ? 'error' : undefined}
                        >
                            <Input
                                value={formData.room}
                                onChange={(e) => handleChange('room', e.target.value)}
                                placeholder="e.g., Lab 301"
                            />
                        </Field>

                        {/* Days of Week */}
                        <Field
                            label={<span>Days <span style={{ color: '#d32f2f' }}>*</span></span>}
                            validationMessage={errors.days}
                            validationState={errors.days ? 'error' : undefined}
                        >
                            <div className={styles.daysContainer}>
                                {DAYS_OF_WEEK.map(day => (
                                    <Checkbox
                                        key={day}
                                        label={String(day).replace(/\*/g, '').trim()}
                                        checked={formData.days.includes(day)}
                                        onChange={() => handleDayToggle(day)}
                                        className={styles.dayCheckbox}
                                    />
                                ))}
                            </div>
                        </Field>

                        {/* Time */}
                        <div className={styles.formRow}>
                            <Field
                                label="Start Time"
                                required
                                validationMessage={errors.startTime}
                                validationState={errors.startTime ? 'error' : undefined}
                                className={styles.formField}
                            >
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => handleChange('startTime', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: errors.startTime ? '2px solid #d32f2f' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </Field>

                            <Field
                                label="End Time"
                                required
                                validationMessage={errors.endTime}
                                validationState={errors.endTime ? 'error' : undefined}
                                className={styles.formField}
                            >
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => handleChange('endTime', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: errors.endTime ? '2px solid #d32f2f' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </Field>
                        </div>

                        {/* Description field removed per UX request */}

                        {/* Color */}
                        <Field label="Color">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className={styles.colorPicker}
                                    style={{ width: '80px' }}
                                />
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {DEFAULT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleChange('color', color)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: color,
                                                border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Field>

                        {/* Active Status */}
                        <Checkbox
                            label="Active"
                            checked={formData.isActive}
                            onChange={(e, data) => handleChange('isActive', data.checked)}
                        />

                        {errors.submit && (
                            <div className={styles.errorText}>{errors.submit}</div>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button appearance="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            appearance="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

export default ScheduleModal;
