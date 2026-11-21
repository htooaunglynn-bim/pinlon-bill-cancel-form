// Response shapes of the bim-lpms POS API (app/Http/Controllers/Api/V1/Pos/PosController.php
// and Staff/QrController.php). Every response is wrapped in the ApiResponse envelope.

export type ApiPayload<T = unknown> = {
    success?: boolean;
    message?: string;
    error_code?: string;
    errors?: Record<string, string[]>;
    data?: T;
};

export type ApiResult<T = unknown> = {
    status: number;
    ok: boolean;
    payload: ApiPayload<T>;
    /** Round-trip time in milliseconds. */
    ms: number;
    /** Set when fetch itself failed (offline, DNS, CORS). */
    networkError?: string;
};

export type HealthResult = {
    status: string;
    checked_at: string;
};

export type CustomerTier = {
    name_en: string;
    name_my: string;
    min_points: number;
    max_points: number;
    points_multiplier: number;
};

export type CustomerLookup = {
    member_code: string;
    name: string;
    father_name: string | null;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    points_balance: number;
    registered_at: string | null;
    tier: CustomerTier | null;
    point_decrease_formular: string;
    point_increase_formular: string;
};

export type PointTransaction = {
    uuid: string;
    type: string;
    status?: string;
    points: number;
    point_earn: number;
    point_deducted: number;
    amount_mmk: number | null;
    balance_after: number;
    description_en?: string | null;
    description_my?: string | null;
    location_id?: number | null;
    reference_type?: string | null;
    reference_id?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
};

export type ProcessPointsResult = {
    transaction: PointTransaction;
    points_balance: number;
};

export type BillReversal = {
    reversal_type: 'refund' | 'recharge' | string;
    reference_type: string;
    original_type: 'earn' | 'redeem' | string;
    points_reversed: number;
    points_balance_after: number;
    reversed_at: string | null;
};

export type BillCancelResult = {
    bill_id: string;
    redemption_id: string | null;
    customer_name: string | null;
    cancelled_at: string | null;
    points_balance_after: number;
    net_points_change: number;
    tier_changed_to: string | null;
    reversals: BillReversal[];
};

export type RedemptionCallbackResult = {
    redemption_uuid: string;
    kind?: string;
    status?: string;
    points_spent?: number;
    points_balance_after?: number;
    reward_name_en?: string;
    reward_name_my?: string;
    discount?: number | string;
    stock_remaining?: number | null;
    validated_at?: string | null;
    customer_name?: string | null;
    callback_state?: string;
    callback_attempts?: number;
    callback_failed_attempts?: number;
};
