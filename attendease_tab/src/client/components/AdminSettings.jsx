import React, { useState } from 'react';
import {
	makeStyles,
	shorthands,
	Text,
	Button,
	Card,
	Badge,
	TabList,
	Tab,
	Divider,
	Spinner,
} from '@fluentui/react-components';
import {
	CheckmarkCircle24Regular,
	DismissCircle24Regular,
	Database24Regular,
	Cloud24Regular,
	Settings24Regular,
	Info24Regular
} from '@fluentui/react-icons';
import { supabase } from '../../config/supabase.config.js';
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
	const [isTestingGraph, setIsTestingGraph] = useState(false);
	const [isTestingSupabase, setIsTestingSupabase] = useState(false);
	// Settings State
	const [settings, setSettings] = useState({
		// Integrations
		graphApiStatus: 'disconnected',
		supabaseStatus: 'connected',
	});
	const handleTestGraphConnection = async () => {
		setIsTestingGraph(true);
		try {
			// Check connectivity to Microsoft Graph API via Backend
			// The backend holds the credentials (AAD_APP_CLIENT_ID, etc.)
			const response = await fetch('/api/integrations/graph/status');
			if (response.ok) {
				setSettings(prev => ({ ...prev, graphApiStatus: 'connected' }));
			} else {
				setSettings(prev => ({ ...prev, graphApiStatus: 'disconnected' }));
			}
		} catch (error) {
			console.error('Graph API connection check failed:', error);
			setSettings(prev => ({ ...prev, graphApiStatus: 'disconnected' }));
		} finally {
			setIsTestingGraph(false);
		}
	};
	const handleTestSupabaseConnection = async () => {
		setIsTestingSupabase(true);
		try {
			const { error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
			if (error) throw error;
			setSettings(prev => ({ ...prev, supabaseStatus: 'connected' }));
		} catch (error) {
			console.error('Supabase connection check failed:', error);
			setSettings(prev => ({ ...prev, supabaseStatus: 'disconnected' }));
		} finally {
			setIsTestingSupabase(false);
		}
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
					<Button 
						appearance="secondary" 
						onClick={handleTestGraphConnection}
						disabled={isTestingGraph}
					>
						{isTestingGraph ? <Spinner size="tiny" /> : 'Test Connection'}
					</Button>
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
					<Button 
						appearance="secondary"
						onClick={handleTestSupabaseConnection}
						disabled={isTestingSupabase}
					>
						{isTestingSupabase ? <Spinner size="tiny" /> : 'Test Connection'}
					</Button>
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
					<Text weight="semibold" size={500}>Version Information: </Text>
				</div>
				<div className={styles.infoGrid}>
					<div className={styles.infoCard}>
						<Text weight="semibold">Frontend: </Text>
						<Text size={400}>v1.0.0</Text>
					</div>
					<div className={styles.infoCard}>
						<Text weight="semibold">Backend: </Text>
						<Text size={400}>v1.0.0</Text>
					</div>
					<div className={styles.infoCard}>
						<Text weight="semibold">Python Service: </Text>
						<Text size={400}>v1.0.0</Text>
					</div>
					<div className={styles.infoCard}>
						<Text weight="semibold">Database Schema: </Text>
						<Text size={400}>v1.0.0</Text>
					</div>
				</div>
			</div>
		</div>
	);
	return (
		<AdminShell>
			<div className={styles.cardHeader}>
				<div className={styles.headerLeft}>
					<Text size={600} weight="bold">About System</Text>
					<Text size={200} style={{ color: '#64748b' }}>Check system connection and information.</Text>
				</div>
			</div>
			<Card className={styles.tabsContainer}>
				<TabList
					selectedValue={selectedTab}
					onTabSelect={(e, data) => setSelectedTab(data.value)}
				>
					<Tab value="integrations">Integrations</Tab>
					<Tab value="system-info">System Info</Tab>
				</TabList>
				{selectedTab === 'integrations' && renderIntegrationsTab()}
				{selectedTab === 'system-info' && renderSystemInfoTab()}
			</Card>
		</AdminShell>
	);
}