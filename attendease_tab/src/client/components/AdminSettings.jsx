import React, { useState } from 'react';
import {
    makeStyles,
    shorthands,
    Text,
    Button,
    Card,
    Input,
    Label,
    Select,
    Switch,
    Slider,
    Badge,
    TabList,
    Tab,
    Divider,
    MessageBar,
    MessageBarBody,
    MessageBarTitle
} from '@fluentui/react-components';
import {
    ArrowLeft24Regular,
    CheckmarkCircle24Regular,
    DismissCircle24Regular,
    Database24Regular,
    Cloud24Regular,
    Camera24Regular,
    Clock24Regular,
    Shield24Regular,
    Settings24Regular,
    Mail24Regular,
    Wrench24Regular,
    Info24Regular
} from '@fluentui/react-icons';
import AdminShell from './AdminShell';

const useStyles = makeStyles({
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        ...shorthands.gap('12px'),
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('4px'),
    },
    tabsContainer: {
        backgroundColor: 'white',
        ...shorthands.borderRadius('8px'),
        ...shorthands.padding('20px'),
    },
    tabContent: {
        ...shorthands.padding('20px', '0'),
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('8px'),
        ...shorthands.padding('8px', '0'),
    },
    settingRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shorthands.padding('12px'),
        backgroundColor: '#f9f9f9',
        ...shorthands.borderRadius('4px'),
    },
    settingLabel: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('4px'),
        flex: 1,
    },
    settingControl: {
        minWidth: '200px',
    },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('8px'),
    },
    actions: {
        display: 'flex',
        ...shorthands.gap('8px'),
        justifyContent: 'flex-end',
        ...shorthands.padding('20px', '0'),
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        ...shorthands.gap('16px'),
    },
    infoCard: {
        ...shorthands.padding('16px'),
        backgroundColor: '#f9f9f9',
        ...shorthands.borderRadius('4px'),
    }
});

export default function AdminSettings() {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState('integrations');
    const [hasChanges, setHasChanges] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        // Integrations
        graphApiStatus: 'connected',
        supabaseStatus: 'connected',
        // Facial Recognition
        pythonServiceUrl: 'http://localhost:5000',
        confidenceThreshold: 0.6,
        detectionSensitivity: 'medium',
        minFaceSize: 20,
        frameProcessingFps: 15,
        showBoundingBoxes: true,
        // Attendance Policies
        gracePeriodMinutes: 10,
        minAttendanceDuration: 30,
        autoLogoutMinutes: 30,
        hybridPriority: 'onsite',
        enableDuplicateDetection: true,
        autoMergeDuplicates: true,
        // Access Control
        studentDomain: '@apc.edu.ph',
        professorDomain: '@apc.edu.ph',
        adminDomain: '@apc.edu.ph',
        autoRoleAssignment: true,
        defaultRole: 'student',
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 3,
        lockAccountAfterMax: true,
        enableRateLimiting: true,
        maxRequestsPerMinute: 100,
        apiTimeoutSeconds: 30,
        // Environment
        environmentMode: 'development',
        enableFacialRecognition: true,
        enableOnlineTracking: true,
        enableAdminConsole: true,
        enableBetaFeatures: false,
        backendPort: 3333,
        pythonPort: 5000,
        frontendPort: 5173,
        // Notifications
        enableEmailNotifications: false,
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        fromAddress: 'attendease@apc.edu.ph',
        lowAttendanceThreshold: 50,
        enableSystemErrorNotifications: true,
        // Maintenance
        archiveBeforeDelete: true,
        clearLogsOlderThanDays: 90,
    });

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        // TODO: Save settings to backend/database
        console.log('Saving settings:', settings);
        setHasChanges(false);
    };

    const handleCancel = () => {
        // TODO: Reset to last saved state
        setHasChanges(false);
    };

    const renderIntegrationsTab = () => (
        <div className={styles.tabContent}>
            {/* Microsoft Graph API */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Cloud24Regular />
                    <Text weight="semibold" size={500}>Microsoft Graph API</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Connection Status</Text>
                        <Text size={200}>Current status of Graph API connection</Text>
                    </div>
                    <div className={styles.statusBadge}>
                        {settings.graphApiStatus === 'connected' ? (
                            <>
                                <CheckmarkCircle24Regular style={{ color: 'green' }} />
                                <Badge color="success">Connected</Badge>
                            </>
                        ) : (
                            <>
                                <DismissCircle24Regular style={{ color: 'red' }} />
                                <Badge color="danger">Disconnected</Badge>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Test Connection</Text>
                        <Text size={200}>Verify Graph API connectivity and permissions</Text>
                    </div>
                    <Button appearance="secondary">Test Connection</Button>
                </div>
            </div>

            <Divider />

            {/* Supabase Database */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Database24Regular />
                    <Text weight="semibold" size={500}>Supabase Database</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Connection Status</Text>
                        <Text size={200}>Current status of database connection</Text>
                    </div>
                    <div className={styles.statusBadge}>
                        {settings.supabaseStatus === 'connected' ? (
                            <>
                                <CheckmarkCircle24Regular style={{ color: 'green' }} />
                                <Badge color="success">Connected</Badge>
                            </>
                        ) : (
                            <>
                                <DismissCircle24Regular style={{ color: 'red' }} />
                                <Badge color="danger">Disconnected</Badge>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Test Connection</Text>
                        <Text size={200}>Verify database connectivity</Text>
                    </div>
                    <Button appearance="secondary">Test Connection</Button>
                </div>
            </div>
        </div>
    );

    const renderFacialRecognitionTab = () => (
        <div className={styles.tabContent}>
            {/* Service Configuration */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Camera24Regular />
                    <Text weight="semibold" size={500}>Python Service Configuration</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Service URL</Text>
                        <Text size={200}>Python facial recognition service endpoint</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        value={settings.pythonServiceUrl}
                        onChange={(e, data) => handleSettingChange('pythonServiceUrl', data.value)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Confidence Threshold</Text>
                        <Text size={200}>Minimum confidence for face matching (0.0 - 1.0)</Text>
                    </div>
                    <div style={{ minWidth: '250px' }}>
                        <Slider
                            value={settings.confidenceThreshold}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={(e, data) => handleSettingChange('confidenceThreshold', data.value)}
                        />
                        <Text size={200}>{settings.confidenceThreshold.toFixed(1)}</Text>
                    </div>
                </div>
            </div>

            <Divider />

            {/* Recognition Parameters */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Recognition Parameters</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Detection Sensitivity</Text>
                        <Text size={200}>Face detection sensitivity level</Text>
                    </div>
                    <Select
                        className={styles.settingControl}
                        value={settings.detectionSensitivity}
                        onChange={(e, data) => handleSettingChange('detectionSensitivity', data.value)}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </Select>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Minimum Face Size</Text>
                        <Text size={200}>Minimum face size in pixels</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.minFaceSize.toString()}
                        onChange={(e, data) => handleSettingChange('minFaceSize', parseInt(data.value) || 20)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Frame Processing (FPS)</Text>
                        <Text size={200}>Frames processed per second (1-30)</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.frameProcessingFps.toString()}
                        onChange={(e, data) => handleSettingChange('frameProcessingFps', parseInt(data.value) || 15)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Show Bounding Boxes</Text>
                        <Text size={200}>Display face detection boxes on video feed</Text>
                    </div>
                    <Switch
                        checked={settings.showBoundingBoxes}
                        onChange={(e, data) => handleSettingChange('showBoundingBoxes', data.checked)}
                    />
                </div>
            </div>
        </div>
    );

    const renderAttendanceTab = () => (
        <div className={styles.tabContent}>
            {/* Timing Configuration */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Clock24Regular />
                    <Text weight="semibold" size={500}>Timing Configuration</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Grace Period (minutes)</Text>
                        <Text size={200}>Allow late arrivals within this period</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.gracePeriodMinutes.toString()}
                        onChange={(e, data) => handleSettingChange('gracePeriodMinutes', parseInt(data.value) || 0)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Minimum Attendance Duration (minutes)</Text>
                        <Text size={200}>Minimum time to mark student as "present"</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.minAttendanceDuration.toString()}
                        onChange={(e, data) => handleSettingChange('minAttendanceDuration', parseInt(data.value) || 0)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Auto-logout after Inactivity (minutes)</Text>
                        <Text size={200}>Automatic logout after this period of inactivity</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.autoLogoutMinutes.toString()}
                        onChange={(e, data) => handleSettingChange('autoLogoutMinutes', parseInt(data.value) || 0)}
                    />
                </div>
            </div>

            <Divider />

            {/* Hybrid Attendance Rules */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Hybrid Attendance Rules</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Priority Mode</Text>
                        <Text size={200}>When student detected both online and onsite</Text>
                    </div>
                    <Select
                        className={styles.settingControl}
                        value={settings.hybridPriority}
                        onChange={(e, data) => handleSettingChange('hybridPriority', data.value)}
                    >
                        <option value="onsite">Onsite takes precedence</option>
                        <option value="online">Online takes precedence</option>
                        <option value="both">Mark as both</option>
                    </Select>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Duplicate Detection</Text>
                        <Text size={200}>Detect duplicate attendance records</Text>
                    </div>
                    <Switch
                        checked={settings.enableDuplicateDetection}
                        onChange={(e, data) => handleSettingChange('enableDuplicateDetection', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Auto-merge Duplicates</Text>
                        <Text size={200}>Automatically merge duplicate records</Text>
                    </div>
                    <Switch
                        checked={settings.autoMergeDuplicates}
                        onChange={(e, data) => handleSettingChange('autoMergeDuplicates', data.checked)}
                    />
                </div>
            </div>
        </div>
    );

    const renderAccessControlTab = () => (
        <div className={styles.tabContent}>
            {/* Email Domain Configuration */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Mail24Regular />
                    <Text weight="semibold" size={500}>Email Domain & Role Management</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Student Domain</Text>
                        <Text size={200}>Allowed email domain for students</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        value={settings.studentDomain}
                        onChange={(e, data) => handleSettingChange('studentDomain', data.value)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Professor Domain</Text>
                        <Text size={200}>Allowed email domain for professors</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        value={settings.professorDomain}
                        onChange={(e, data) => handleSettingChange('professorDomain', data.value)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Admin Domain</Text>
                        <Text size={200}>Allowed email domain for admins</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        value={settings.adminDomain}
                        onChange={(e, data) => handleSettingChange('adminDomain', data.value)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Auto-Role Assignment</Text>
                        <Text size={200}>Automatically assign roles based on email domain</Text>
                    </div>
                    <Switch
                        checked={settings.autoRoleAssignment}
                        onChange={(e, data) => handleSettingChange('autoRoleAssignment', data.checked)}
                    />
                </div>
            </div>

            <Divider />

            {/* Security Settings */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Shield24Regular />
                    <Text weight="semibold" size={500}>Security Settings</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Session Timeout (minutes)</Text>
                        <Text size={200}>Admin session expires after this period</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.sessionTimeoutMinutes.toString()}
                        onChange={(e, data) => handleSettingChange('sessionTimeoutMinutes', parseInt(data.value) || 30)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Max Login Attempts</Text>
                        <Text size={200}>Maximum failed login attempts before lockout</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.maxLoginAttempts.toString()}
                        onChange={(e, data) => handleSettingChange('maxLoginAttempts', parseInt(data.value) || 3)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Lock Account After Max Attempts</Text>
                        <Text size={200}>Lock account when max attempts exceeded</Text>
                    </div>
                    <Switch
                        checked={settings.lockAccountAfterMax}
                        onChange={(e, data) => handleSettingChange('lockAccountAfterMax', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Rate Limiting</Text>
                        <Text size={200}>Limit API requests per user</Text>
                    </div>
                    <Switch
                        checked={settings.enableRateLimiting}
                        onChange={(e, data) => handleSettingChange('enableRateLimiting', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Max Requests Per Minute</Text>
                        <Text size={200}>API rate limit threshold</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.maxRequestsPerMinute.toString()}
                        onChange={(e, data) => handleSettingChange('maxRequestsPerMinute', parseInt(data.value) || 100)}
                    />
                </div>
            </div>
        </div>
    );

    const renderEnvironmentTab = () => (
        <div className={styles.tabContent}>
            {/* Environment Mode */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Environment Configuration</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Environment Mode</Text>
                        <Text size={200}>Operating environment</Text>
                    </div>
                    <Select
                        className={styles.settingControl}
                        value={settings.environmentMode}
                        onChange={(e, data) => handleSettingChange('environmentMode', data.value)}
                    >
                        <option value="development">Development</option>
                        <option value="production">Production</option>
                    </Select>
                </div>
            </div>

            <Divider />

            {/* Feature Flags */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Feature Flags</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Facial Recognition</Text>
                        <Text size={200}>Allow onsite attendance tracking via facial recognition</Text>
                    </div>
                    <Switch
                        checked={settings.enableFacialRecognition}
                        onChange={(e, data) => handleSettingChange('enableFacialRecognition', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Online Tracking</Text>
                        <Text size={200}>Allow online attendance via Teams Graph API</Text>
                    </div>
                    <Switch
                        checked={settings.enableOnlineTracking}
                        onChange={(e, data) => handleSettingChange('enableOnlineTracking', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Admin Console</Text>
                        <Text size={200}>Allow access to admin features</Text>
                    </div>
                    <Switch
                        checked={settings.enableAdminConsole}
                        onChange={(e, data) => handleSettingChange('enableAdminConsole', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Beta Features</Text>
                        <Text size={200}>Enable experimental features (use with caution)</Text>
                    </div>
                    <Switch
                        checked={settings.enableBetaFeatures}
                        onChange={(e, data) => handleSettingChange('enableBetaFeatures', data.checked)}
                    />
                </div>
            </div>

            <Divider />

            {/* Port Configuration */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Port Configuration (Development Only)</Text>
                </div>

                <MessageBar intent="warning">
                    <MessageBarBody>
                        <MessageBarTitle>Warning</MessageBarTitle>
                        Changing ports requires application restart. Only modify in development mode.
                    </MessageBarBody>
                </MessageBar>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Backend Port</Text>
                        <Text size={200}>Express.js backend server port</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.backendPort.toString()}
                        onChange={(e, data) => handleSettingChange('backendPort', parseInt(data.value) || 3333)}
                        disabled={settings.environmentMode === 'production'}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Python Service Port</Text>
                        <Text size={200}>Facial recognition service port</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.pythonPort.toString()}
                        onChange={(e, data) => handleSettingChange('pythonPort', parseInt(data.value) || 5000)}
                        disabled={settings.environmentMode === 'production'}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Frontend Port</Text>
                        <Text size={200}>Vite development server port</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.frontendPort.toString()}
                        onChange={(e, data) => handleSettingChange('frontendPort', parseInt(data.value) || 5173)}
                        disabled={settings.environmentMode === 'production'}
                    />
                </div>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className={styles.tabContent}>
            {/* Email Notifications */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Mail24Regular />
                    <Text weight="semibold" size={500}>Email Notifications</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Enable Email Notifications</Text>
                        <Text size={200}>Send email alerts and notifications</Text>
                    </div>
                    <Switch
                        checked={settings.enableEmailNotifications}
                        onChange={(e, data) => handleSettingChange('enableEmailNotifications', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">SMTP Server</Text>
                        <Text size={200}>Mail server hostname</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        value={settings.smtpServer}
                        onChange={(e, data) => handleSettingChange('smtpServer', data.value)}
                        disabled={!settings.enableEmailNotifications}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">SMTP Port</Text>
                        <Text size={200}>Mail server port</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.smtpPort.toString()}
                        onChange={(e, data) => handleSettingChange('smtpPort', parseInt(data.value) || 587)}
                        disabled={!settings.enableEmailNotifications}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">From Address</Text>
                        <Text size={200}>Email sender address</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="email"
                        value={settings.fromAddress}
                        onChange={(e, data) => handleSettingChange('fromAddress', data.value)}
                        disabled={!settings.enableEmailNotifications}
                    />
                </div>
            </div>

            <Divider />

            {/* Alert Thresholds */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Alert Thresholds</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Low Attendance Alert (%)</Text>
                        <Text size={200}>Trigger alert when attendance falls below this percentage</Text>
                    </div>
                    <Input
                        className={styles.settingControl}
                        type="number"
                        value={settings.lowAttendanceThreshold.toString()}
                        onChange={(e, data) => handleSettingChange('lowAttendanceThreshold', parseInt(data.value) || 50)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">System Error Notifications</Text>
                        <Text size={200}>Send notifications for system errors</Text>
                    </div>
                    <Switch
                        checked={settings.enableSystemErrorNotifications}
                        onChange={(e, data) => handleSettingChange('enableSystemErrorNotifications', data.checked)}
                    />
                </div>
            </div>
        </div>
    );

    const renderMaintenanceTab = () => (
        <div className={styles.tabContent}>
            {/* Data Management */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Wrench24Regular />
                    <Text weight="semibold" size={500}>Data Management</Text>
                </div>

                <MessageBar intent="warning">
                    <MessageBarBody>
                        <MessageBarTitle>Caution</MessageBarTitle>
                        Data operations are irreversible. Please proceed with caution.
                    </MessageBarBody>
                </MessageBar>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Clear Old Logs</Text>
                        <Text size={200}>Remove attendance logs older than specified days</Text>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Input
                            style={{ width: '100px' }}
                            type="number"
                            value={settings.clearLogsOlderThanDays.toString()}
                            onChange={(e, data) => handleSettingChange('clearLogsOlderThanDays', parseInt(data.value) || 90)}
                        />
                        <Text size={200}>days</Text>
                        <Button appearance="secondary">Clear Old Data</Button>
                    </div>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Archive Before Deletion</Text>
                        <Text size={200}>Export logs to CSV before clearing</Text>
                    </div>
                    <Switch
                        checked={settings.archiveBeforeDelete}
                        onChange={(e, data) => handleSettingChange('archiveBeforeDelete', data.checked)}
                    />
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Reset System Data</Text>
                        <Text size={200}>Clear all data and reset to defaults (requires confirmation)</Text>
                    </div>
                    <Button appearance="secondary">Reset System</Button>
                </div>
            </div>

            <Divider />

            {/* Cache Management */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>Cache Management</Text>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Clear Application Cache</Text>
                        <Text size={200}>Clear cached application data</Text>
                    </div>
                    <Button appearance="secondary">Clear Cache</Button>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Clear Face Recognition Cache</Text>
                        <Text size={200}>Clear cached face recognition models</Text>
                    </div>
                    <Button appearance="secondary">Clear FR Cache</Button>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Reload Configurations</Text>
                        <Text size={200}>Force reload all system configurations</Text>
                    </div>
                    <Button appearance="secondary">Reload Config</Button>
                </div>
            </div>
        </div>
    );

    const renderSystemInfoTab = () => (
        <div className={styles.tabContent}>
            {/* Version Information */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Info24Regular />
                    <Text weight="semibold" size={500}>Version Information</Text>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Frontend</Text>
                        <Text size={400}>v1.0.0</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Backend</Text>
                        <Text size={400}>v1.0.0</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Python Service</Text>
                        <Text size={400}>v1.0.0</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Database Schema</Text>
                        <Text size={400}>v1.0.0</Text>
                    </div>
                </div>
            </div>

            <Divider />

            {/* System Status */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={500}>System Status</Text>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Server Uptime</Text>
                        <Text size={400}>2d 14h 32m</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Last Restart</Text>
                        <Text size={400}>2026-01-03 10:15:32</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Active Sessions</Text>
                        <Text size={400}>5</Text>
                    </div>
                    <div className={styles.infoCard}>
                        <Text weight="semibold">Database Size</Text>
                        <Text size={400}>42.3 MB</Text>
                    </div>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                        <Text weight="semibold">Recent Errors</Text>
                        <Text size={200}>View system error logs</Text>
                    </div>
                    <Button appearance="secondary">View Error Log</Button>
                </div>
            </div>
        </div>
    );

    return (
        <AdminShell>
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <Text size={600} weight="bold">System Settings</Text>
                    <Text size={200} style={{ color: '#64748b' }}>Configure integration settings and environment toggles.</Text>
                </div>
            </div>

            <Card className={styles.tabsContainer}>
                <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(e, data) => setSelectedTab(data.value)}
                >
                    <Tab value="integrations">Integrations</Tab>
                    <Tab value="facial-recognition">Facial Recognition</Tab>
                    <Tab value="attendance">Attendance</Tab>
                    <Tab value="access-control">Access Control</Tab>
                    <Tab value="environment">Environment</Tab>
                    <Tab value="notifications">Notifications</Tab>
                    <Tab value="maintenance">Maintenance</Tab>
                    <Tab value="system-info">System Info</Tab>
                </TabList>

                {selectedTab === 'integrations' && renderIntegrationsTab()}
                {selectedTab === 'facial-recognition' && renderFacialRecognitionTab()}
                {selectedTab === 'attendance' && renderAttendanceTab()}
                {selectedTab === 'access-control' && renderAccessControlTab()}
                {selectedTab === 'environment' && renderEnvironmentTab()}
                {selectedTab === 'notifications' && renderNotificationsTab()}
                {selectedTab === 'maintenance' && renderMaintenanceTab()}
                {selectedTab === 'system-info' && renderSystemInfoTab()}

                {hasChanges && selectedTab !== 'system-info' && selectedTab !== 'maintenance' && (
                    <>
                        <Divider />
                        <div className={styles.actions}>
                            <Button appearance="secondary" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button appearance="primary" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </AdminShell>
    );
}
