-- Create a secure function for user creation that bypasses RLS
-- This is called from the backend/service role and handles user profile creation

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
BEGIN
    -- Insert the profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        status,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_phone,
        p_role,
        p_status,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = p_email,
        first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        role = p_role,
        status = p_status,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
