-- Add price column to utility_constants for fixed fees
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- Update existing fixed utilities with default prices (you can change these values)
UPDATE public.utility_constants 
SET price = 500 
WHERE is_metered = FALSE AND utility_name = 'Garbage';

UPDATE public.utility_constants 
SET price = 1000 
WHERE is_metered = FALSE AND utility_name = 'Security';

UPDATE public.utility_constants 
SET price = 500 
WHERE is_metered = FALSE AND utility_name = 'Service';

-- Verify the changes
SELECT utility_name, is_metered, constant, price FROM public.utility_constants ORDER BY utility_name;
