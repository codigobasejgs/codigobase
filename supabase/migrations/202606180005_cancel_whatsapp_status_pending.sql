update public.cb_whatsapp_status_posts
set status = 'cancelled',
    recurrence_enabled = false,
    recurrence_frequency = 'none',
    recurrence_times = '{}',
    recurrence_weekdays = '{}',
    recurrence_month_days = '{}',
    recurrence_until = null,
    error_message = null,
    updated_at = now()
where status in ('scheduled', 'publishing', 'pending_confirmation', 'error');
