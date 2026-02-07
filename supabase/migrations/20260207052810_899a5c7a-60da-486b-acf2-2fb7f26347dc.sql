-- Add time_estimate column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN time_estimate integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.time_estimate IS 'Time estimate in minutes';
