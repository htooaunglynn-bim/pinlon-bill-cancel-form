// Response shapes of the bim-lpms POS API (app/Http/Controllers/Api/V1/Pos/PosController.php
// and Staff/QrController.php). Every response is wrapped in the ApiResponse envelope.

export type ApiPayload<T = unknown> = {
    success?: boolean;
    message?: string;
    error_code?: string;
    errors?: Record<string, string[] | number | string>;
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

// ---- Customer (mobile app) API: /api/v1/customer ------------------------------------------

export type OtpRequestResult = {
    otp_expires_in: number;
};

export type CustomerProfile = {
    uuid?: string;
    member_code: string;
    name: string;
    phone: string | null;
    points_balance: number | string;
    lifetime_points?: number | string;
    is_family_member?: boolean;
    tier?: { name_en?: string; name?: string; points_multiplier?: number | string } | null;
};

export type OtpVerifyResult = {
    access_token: string;
    token_type: string;
    customer: CustomerProfile;
};

export type PosScanQrResult = {
    qr_image: string;
    qr_string: string;
    token: string;
    expires_at: string | null;
};

/** Subset of PointTransactionResource returned by GET /api/v1/customer/points/history. */
export type CustomerTransaction = {
    uuid: string;
    type: string;
    points: number | string;
    reference_id: string | null;
    amount_mmk?: number | string | null;
    description_en?: string | null;
    created_at: string | null;
};

/** RewardResource from GET /api/v1/customer/rewards. */
export type Reward = {
    id: number;
    reward_id?: string | null;
    name_en: string;
    name_my?: string | null;
    description_en?: string | null;
    points_required: number;
    category?: { name_en?: string; name?: string } | null;
    image_url?: string | null;
    tiers?: { name_en?: string }[];
    stock_quantity: number | null;
    valid_from?: string | null;
    valid_until?: string | null;
    redemption_instructions_en?: string | null;
    terms_and_conditions_en?: string | null;
    is_baby?: boolean;
};

/** RedemptionResource from POST /rewards/{id}/redeem and GET /rewards/{uuid}/status. */
export type RewardRedemption = {
    uuid: string;
    reward?: Reward;
    kind?: string | null;
    points_spent: number;
    qr_code?: string | null;
    qr_expires_at: string | null;
    status: 'pending' | 'validated' | 'expired' | 'cancelled' | string;
    validated_at?: string | null;
    created_at?: string | null;
};

export type RewardQrResult = {
    qr_image: string;
    qr_string: string | null;
    qr_expires_at: string | null;
};
