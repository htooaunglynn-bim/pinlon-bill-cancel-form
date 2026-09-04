/** Single source of truth for the sidebar links. */
export const NAV = [
    { to: '/',            label: 'Staff Login',        icon: 'staff'    },
    { to: '/formulas',    label: 'Formulas & Preview', icon: 'formulas' },
    { to: '/earn',        label: 'Earn Test',          icon: 'earn'     },
    { to: '/bill-cancel', label: 'Bill Cancel',        icon: 'error'    },
    { to: '/audit',       label: 'Audit & Activity',   icon: 'preview'  },
] as const;
