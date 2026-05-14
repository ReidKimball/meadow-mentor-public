import { Card, CardContent, FormControl, InputLabel, Select, MenuItem, Box, Typography, useTheme } from '@mui/material';

const AI_STYLES = [
    {
        value: "FRIENDLY",
        icon: "😊", 
        label: "Friendly",
        description: "Warm and encouraging mentorship"
    },
    {
        value: "ECOPUNK",
        icon: "🌱",
        label: "Ecopunk",
        description: "Sustainable and edgy mentorship"
    },
    {
        value: "MINIMAL",
        icon: "⚡",
        label: "Minimalist",
        description: "Clear, concise mentorship"
    }
];

export default function AIStyleSelector({ value, onChange, disabled }) {
    const theme = useTheme();
    
    return (
        <Card 
            elevation={2} 
            sx={{ 
                width: { xs: '100%', sm: '400px' },
                margin: '0 auto',
                borderRadius: 2,
                overflow: 'visible',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[4]
                }
            }}
        >
            <CardContent sx={{ 
                background: `linear-gradient(to right, ${theme.palette.primary.light}15, ${theme.palette.secondary.light}10)`,
                padding: 3,
            }}>
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 500, color: theme.palette.primary.main }}>
                        Choose Conversation Style
                    </Typography>
                </Box>
                
                <FormControl variant="outlined" fullWidth sx={{ minWidth: '220px' }}>
                    <Select
                        value={value || "MINIMAL"}
                        onChange={onChange}
                        disabled={disabled}
                        displayEmpty
                        MenuProps={{
                            PaperProps: {
                                style: { 
                                    maxHeight: 300,
                                    width: '400px'
                                }
                            }
                        }}
                        sx={{
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main,
                            },
                            '& .MuiSelect-select': {
                                padding: '12px 16px',
                            }
                        }}
                    >
                        {AI_STYLES.map((style) => (
                            <MenuItem 
                                key={style.value} 
                                value={style.value} 
                                sx={{ 
                                    py: 2,
                                    px: 2,
                                    '&.Mui-selected': {
                                        backgroundColor: `${theme.palette.primary.light}20`,
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: `${theme.palette.primary.light}30`,
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        <Box component="span" sx={{ fontSize: '1.5rem', mr: 1 }}>{style.icon}</Box> 
                                        {style.label}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {style.description}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </CardContent>
        </Card>
    );
}
