-- Add email confirmation tracking to profiles table
-- Supports email verification workflows

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Update the function to handle email confirmation
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'tenant',
    p_status TEXT DEFAULT 'active'
)
RETURNS TABLE (
    success BOOLEAN,
    user_id UUID,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email_confirmed BOOLEAN;
BEGIN
    -- Check if user email is confirmed in auth.users
    SELECT email_confirmed_at IS NOT NULL INTO v_email_confirmed
    FROM auth.users 
    WHERE id = p_user_id;
    
    -- If NULL, default to false
    v_email_confirmed := COALESCE(v_email_confirmed, FALSE);

    -- Insert or update the profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        status,
        email_confirmed,
        email_confirmed_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_phone,
        p_role,
        p_status,
        v_email_confirmed,
        CASE WHEN v_email_confirmed THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = p_email,
        first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        role = p_role,
        status = p_status,
        email_confirmed = v_email_confirmed,
        email_confirmed_at = CASE 
            WHEN v_email_confirmed AND profiles.email_confirmed_at IS NULL THEN NOW()
            WHEN profiles.email_confirmed THEN profiles.email_confirmed_at
            ELSE NULL
        END,
        updated_at = NOW();

    RETURN QUERY SELECT 
        true,
        p_user_id,
        'Profile created/updated successfully'::TEXT;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        false,
        p_user_id,
        ('Error: ' || SQLERRM)::TEXT;
END;
$$;

-- Function to check email confirmation status
CREATE OR REPLACE FUNCTION check_email_confirmed(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    email_confirmed BOOLEAN,
    email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email_confirmed_at IS NOT NULL,
        p.email
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE p.id = p_user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_email_confirmed(UUID) TO authenticated, service_role;
