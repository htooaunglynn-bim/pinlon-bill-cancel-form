/** Single source of truth for the sidebar links. */
export const NAV = [
    { to: '/',         label: 'Staff Login',         icon: 'staff'    },
    { to: '/formulas', label: 'Formulas & Preview',  icon: 'formulas' },
    { to: '/earn',     label: 'Earn Test',           icon: 'earn'     },
] as const;
