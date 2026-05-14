/**
 * @file GrowthEnginePage.jsx
 * @module pages/Admin/GrowthEnginePage
 * @description Admin page for the Meadow Growth Engine.
 * Allows admins to sync Gmail drafts to Sanity blog posts.
 * @version 1.0.0
 * @date 2026-01-22
 * @author Antigravity
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    Card,
    CardContent,
    Stack,
    ListItemButton,
} from '@mui/material';
import {
    Sync as SyncIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Email as EmailIcon,
    Article as ArticleIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * @function GrowthEnginePage
 * @description Admin page component for managing the Meadow Growth Engine.
 * Provides controls for Gmail to Sanity blog sync.
 * @returns {JSX.Element} The Growth Engine admin page
 */
const GrowthEnginePage = () => {
    const { getFreshIdToken } = useUser();

    // Connection status state
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [testingConnections, setTestingConnections] = useState(false);

    // Pending drafts state
    const [pendingDrafts, setPendingDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    // Import state
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);

    // Newsletter state
    const [publishedPosts, setPublishedPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [selectedPostSlug, setSelectedPostSlug] = useState('');
    const [creatingCampaign, setCreatingCampaign] = useState(false);
    const [campaignResult, setCampaignResult] = useState(null);
    const [campaignSummaryHtml, setCampaignSummaryHtml] = useState('');
    const [campaignCopyStatus, setCampaignCopyStatus] = useState('');

    // Error state
    const [error, setError] = useState(null);

    /**
     * @function getGmailConnectionDetailText
     * @description Formats Gmail connection diagnostics returned by the backend.
     * Keeps the UI messaging clear for admins when OAuth issues happen.
     * @param {object} gmailStatus - Gmail status payload from /test-connections.
     * @returns {{description: string, hint: string, meta: string}} User-friendly diagnostics for rendering.
     */
    const getGmailConnectionDetailText = (gmailStatus) => {
        const details = gmailStatus?.details || {};
        const description = details.description || gmailStatus?.error || 'Unknown Gmail connection error.';
        const hint = details.hint || 'Check OAuth credentials and refresh token in backend environment variables.';

        const metaParts = [];
        if (details.reason) metaParts.push(`Reason: ${details.reason}`);
        if (details.status) metaParts.push(`HTTP: ${details.status}`);

        return {
            description,
            hint,
            meta: metaParts.join(' | '),
        };
    };

    /**
     * @function testConnections
     * @description Tests connections to Gmail and Sanity APIs.
     */
    const testConnections = useCallback(async () => {
        setTestingConnections(true);
        setError(null);
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_URL}/api/admin/growth/test-connections`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                throw new Error(
                    errorPayload?.details || errorPayload?.error || 'Failed to test connections'
                );
            }

            const data = await response.json();
            setConnectionStatus(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setTestingConnections(false);
        }
    }, [getFreshIdToken]);

    /**
     * @function fetchPendingDrafts
     * @description Fetches Gmail drafts with "Ready for Meadow" label.
     */
    const fetchPendingDrafts = useCallback(async () => {
        setLoadingDrafts(true);
        setError(null);
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_URL}/api/admin/growth/pending-drafts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pending drafts');
            }

            const data = await response.json();
            setPendingDrafts(data.drafts || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDrafts(false);
        }
    }, [getFreshIdToken]);

    /**
     * @function importDrafts
     * @description Triggers the Gmail to Sanity import process.
     */
    const importDrafts = useCallback(async () => {
        setImporting(true);
        setError(null);
        setImportResults(null);
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_URL}/api/admin/growth/gmail-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to import drafts');
            }

            const data = await response.json();
            setImportResults(data.results);

            // Refresh pending drafts after import
            await fetchPendingDrafts();
        } catch (err) {
            setError(err.message);
        } finally {
            setImporting(false);
        }
    }, [getFreshIdToken, fetchPendingDrafts]);

    /**
     * @function fetchPublishedPosts
     * @description Fetches published Sanity posts for newsletter selection.
     */
    const fetchPublishedPosts = useCallback(async () => {
        setLoadingPosts(true);
        setError(null);
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_URL}/api/admin/growth/published-posts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch published posts');
            }

            const data = await response.json();
            setPublishedPosts(data.posts || []);
            setSelectedPostSlug('');
            setCampaignResult(null);
            setCampaignSummaryHtml('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingPosts(false);
        }
    }, [getFreshIdToken]);

    /**
     * @function createMailerLiteDraft
     * @description Creates a MailerLite campaign draft from the selected post.
     */
    const createMailerLiteDraft = useCallback(async () => {
        if (!selectedPostSlug) {
            setError('Select a published post first.');
            return;
        }

        setCreatingCampaign(true);
        setError(null);
        setCampaignResult(null);
        setCampaignSummaryHtml('');
        try {
            const token = await getFreshIdToken();
            const response = await fetch(`${API_URL}/api/admin/growth/mailerlite-campaign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ slug: selectedPostSlug }),
            });

            if (!response.ok) {
                throw new Error('Failed to create MailerLite draft');
            }

            const data = await response.json();
            setCampaignResult(data.campaign || null);
            setCampaignSummaryHtml(data.summaryHtml || '');
            setCampaignCopyStatus('');
        } catch (err) {
            setError(err.message);
        } finally {
            setCreatingCampaign(false);
        }
    }, [getFreshIdToken, selectedPostSlug]);

    /**
     * @function copySummaryHtml
     * @description Copies the raw HTML summary for MailerLite paste.
     */
    const copySummaryHtml = useCallback(async () => {
        if (!campaignSummaryHtml) {
            setCampaignCopyStatus('No summary HTML available to copy.');
            return;
        }

        try {
            await navigator.clipboard.writeText(campaignSummaryHtml);
            setCampaignCopyStatus('Copied HTML to clipboard.');
        } catch (err) {
            setCampaignCopyStatus('Copy failed. Please try again.');
        }
    }, [campaignSummaryHtml]);

    /**
     * @function copySummaryAsPlainText
     * @description Copies the summary HTML as plain text for MailerLite paste.
     */
    const copySummaryAsPlainText = useCallback(async () => {
        if (!campaignSummaryHtml) {
            setCampaignCopyStatus('No summary HTML available to copy.');
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(campaignSummaryHtml, 'text/html');
        const plainText = (doc.body.textContent || '').trim();

        try {
            await navigator.clipboard.writeText(plainText);
            setCampaignCopyStatus('Copied plain text to clipboard.');
        } catch (err) {
            setCampaignCopyStatus('Copy failed. Please try again.');
        }
    }, [campaignSummaryHtml]);

    // Test connections on mount
    useEffect(() => {
        testConnections();
    }, [testConnections]);

    const gmailDiagnostics =
        connectionStatus && !connectionStatus.gmail?.success
            ? getGmailConnectionDetailText(connectionStatus.gmail)
            : null;

    return (
        <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                🌱 Meadow Growth Engine
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Automate your content pipeline from Gmail drafts to Sanity blog posts.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Connection Status Card */}
            <Card sx={{ mb: 3, order: 1 }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">API Connections</Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={testConnections}
                            disabled={testingConnections}
                            startIcon={testingConnections ? <CircularProgress size={16} /> : <SyncIcon />}
                        >
                            Test Connections
                        </Button>
                    </Stack>

                    {testingConnections ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : connectionStatus ? (
                        <>
                            <Stack direction="row" spacing={2}>
                                <Chip
                                    icon={connectionStatus.gmail?.success ? <CheckCircleIcon /> : <ErrorIcon />}
                                    label={`Gmail: ${connectionStatus.gmail?.success ? connectionStatus.gmail.email : 'Not Connected'}`}
                                    color={connectionStatus.gmail?.success ? 'success' : 'error'}
                                    variant="outlined"
                                />
                                <Chip
                                    icon={connectionStatus.sanity?.success ? <CheckCircleIcon /> : <ErrorIcon />}
                                    label={`Sanity: ${connectionStatus.sanity?.success ? 'Connected' : 'Not Connected'}`}
                                    color={connectionStatus.sanity?.success ? 'success' : 'error'}
                                    variant="outlined"
                                />
                            </Stack>

                            {!connectionStatus.gmail?.success && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Gmail connection diagnostics
                                    </Typography>
                                    <Typography variant="body2">
                                        {gmailDiagnostics?.description}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {gmailDiagnostics?.hint}
                                    </Typography>
                                    {gmailDiagnostics?.meta && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {gmailDiagnostics.meta}
                                        </Typography>
                                    )}
                                </Alert>
                            )}
                        </>
                    ) : (
                        <Typography color="text.secondary">Click "Test Connections" to check API status.</Typography>
                    )}
                </CardContent>
            </Card>

            {/* Sanity to MailerLite Newsletter Card */}
            <Card sx={{ mb: 3, order: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Sanity → MailerLite Newsletter
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={fetchPublishedPosts}
                            disabled={loadingPosts}
                            startIcon={loadingPosts ? <CircularProgress size={16} /> : <VisibilityIcon />}
                        >
                            Load Published Posts
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={createMailerLiteDraft}
                            disabled={creatingCampaign || !selectedPostSlug}
                            startIcon={creatingCampaign ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                        >
                            {creatingCampaign ? 'Creating Draft...' : 'Create MailerLite Draft'}
                        </Button>
                    </Stack>

                    {loadingPosts ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : publishedPosts.length > 0 ? (
                        <Paper variant="outlined">
                            <List dense>
                                {publishedPosts.map((post, index) => {
                                    const slug = post.slug?.current || '';
                                    const isSelected = slug === selectedPostSlug;

                                    return (
                                        <React.Fragment key={post._id || slug || index}>
                                            {index > 0 && <Divider />}
                                            <ListItem disableGutters>
                                                <ListItemButton
                                                    selected={isSelected}
                                                    onClick={() => setSelectedPostSlug(slug)}
                                                >
                                                    <ListItemIcon>
                                                        <ArticleIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={post.title || 'Untitled Post'}
                                                        secondary={`Slug: ${slug || 'missing'}`}
                                                        slotProps={{
                                                            primary: { fontSize: '1rem', fontWeight: 'normal' },
                                                            secondary: { fontSize: '0.875rem' }
                                                        }}
                                                    />
                                                    {isSelected && <Chip label="Selected" size="small" color="success" />}
                                                </ListItemButton>
                                            </ListItem>
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        </Paper>
                    ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No published posts found. Publish a blog post in Sanity to get started.
                        </Typography>
                    )}

                    {campaignResult && (
                        <Alert severity="success" sx={{ mt: 3 }}>
                            MailerLite draft created (ID: {campaignResult.id || 'unknown'}).
                        </Alert>
                    )}

                    {campaignSummaryHtml && (
                        <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Paste this HTML into MailerLite:
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    backgroundColor: '#f7f7f7',
                                    padding: 2,
                                    borderRadius: 1,
                                    maxHeight: 280,
                                    overflow: 'auto',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {campaignSummaryHtml}
                            </Box>
                            <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Button variant="outlined" size="small" onClick={copySummaryHtml}>
                                    Copy HTML
                                </Button>
                                <Button variant="outlined" size="small" onClick={copySummaryAsPlainText}>
                                    Copy Plain Text
                                </Button>
                                {campaignCopyStatus && (
                                    <Typography variant="caption" color="text.secondary">
                                        {campaignCopyStatus}
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>
                    )}
                </CardContent>
            </Card>

            {/* Gmail to Sanity Sync Card */}
            <Card sx={{ mb: 3, order: 2 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Gmail → Sanity Blog Sync
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={fetchPendingDrafts}
                            disabled={loadingDrafts}
                            startIcon={loadingDrafts ? <CircularProgress size={16} /> : <VisibilityIcon />}
                        >
                            Preview Pending Drafts
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={importDrafts}
                            disabled={importing || pendingDrafts.length === 0}
                            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                        >
                            {importing ? 'Importing...' : 'Import to Sanity'}
                        </Button>
                    </Stack>

                    {/* Pending Drafts List */}
                    {loadingDrafts ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : pendingDrafts.length > 0 ? (
                        <Paper variant="outlined">
                            <List dense>
                                {pendingDrafts.map((draft, index) => (
                                    <React.Fragment key={draft.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem>
                                            <ListItemIcon>
                                                <ArticleIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={draft.subject || 'Untitled Draft'}
                                                secondary={`Draft ID: ${draft.id}`}
                                                //change font size
                                                slotProps={{
                                                    primary: { fontSize: '1rem', fontWeight: 'normal' },
                                                    secondary: { fontSize: '0.875rem' }
                                                }}
                                            />
                                            <Chip label="Ready for Meadow" size="medium" color="warning" />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No pending drafts found. Drafts with the "Ready for Meadow" label will appear here.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Import Results */}
            {importResults && (
                <Card sx={{ order: 4 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Import Results
                        </Typography>

                        {importResults.success?.length > 0 && (
                            <>
                                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                                    ✅ Successfully Imported ({importResults.success.length})
                                </Typography>
                                <List dense>
                                    {importResults.success.map((item) => (
                                        <ListItem key={item.sanityDocumentId}>
                                            <ListItemIcon>
                                                <CheckCircleIcon color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.title}
                                                secondary={`Slug: ${item.slug}`}
                                                slotProps={{
                                                    primary: { fontSize: '1rem', fontWeight: 'normal' },
                                                    secondary: { fontSize: '0.875rem' }
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}

                        {importResults.errors?.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                                    ❌ Failed ({importResults.errors.length})
                                </Typography>
                                <List dense>
                                    {importResults.errors.map((item) => (
                                        <ListItem key={item.gmailDraftId}>
                                            <ListItemIcon>
                                                <ErrorIcon color="error" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`Draft ID: ${item.gmailDraftId}`}
                                                secondary={item.error}
                                                slotProps={{
                                                    primary: { fontSize: '1rem', fontWeight: 'normal' },
                                                    secondary: { fontSize: '0.875rem' }
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default GrowthEnginePage;
