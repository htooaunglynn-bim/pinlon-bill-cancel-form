export type NavItem = { to: string; label: string; icon: string };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV: NavGroup[] = [
    { items: [{ to: '/', label: 'Overview', icon: 'sparkles' }] },
    {
        label: 'QR generation',
        items: [
            { to: '/onboarding', label: 'Onboarding QR', icon: 'staff' },
            { to: '/invoice', label: 'Invoice QR', icon: 'preview' },
        ],
    },
    {
        label: 'Mobile',
        items: [{ to: '/mobile', label: 'Customer app', icon: 'sparkles' }],
    },
    {
        label: 'POS terminal',
        items: [
            { to: '/terminal/lookup', label: 'Customer lookup', icon: 'staff' },
            { to: '/terminal/points', label: 'Earn / Redeem', icon: 'earn' },
            { to: '/terminal/bill-cancel', label: 'Bill cancel', icon: 'error' },
            { to: '/terminal/redemptions', label: 'Redemptions', icon: 'coin' },
        ],
    },
    {
        label: 'Admin',
        items: [
            { to: '/history', label: 'Activity history', icon: 'formulas' },
            { to: '/settings', label: 'Settings', icon: 'success' },
        ],
    },
];
