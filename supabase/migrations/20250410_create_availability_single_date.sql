-- Create availability_single_date table
CREATE TABLE IF NOT EXISTS public.availability_single_date (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE public.availability_single_date IS 'Stores clinician availability for specific dates (exceptions to regular weekly schedule)';

-- Create index for faster lookups
CREATE INDEX idx_availability_single_date_clinician_id ON public.availability_single_date(clinician_id);
CREATE INDEX idx_availability_single_date_date ON public.availability_single_date(date);
CREATE INDEX idx_availability_single_date_clinician_date ON public.availability_single_date(clinician_id, date);

-- Enable Row Level Security
ALTER TABLE public.availability_single_date ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- 1. Allow users to view their own availability
CREATE POLICY "Users can view their own availability_single_date"
    ON public.availability_single_date
    FOR SELECT
    USING (auth.uid() = clinician_id);

-- 2. Allow users to insert their own availability
CREATE POLICY "Users can insert their own availability_single_date"
    ON public.availability_single_date
    FOR INSERT
    WITH CHECK (auth.uid() = clinician_id);

-- 3. Allow users to update their own availability
CREATE POLICY "Users can update their own availability_single_date"
    ON public.availability_single_date
    FOR UPDATE
    USING (auth.uid() = clinician_id)
    WITH CHECK (auth.uid() = clinician_id);

-- 4. Allow users to delete their own availability
CREATE POLICY "Users can delete their own availability_single_date"
    ON public.availability_single_date
    FOR DELETE
    USING (auth.uid() = clinician_id);

-- 5. Allow admin users to view all availability
CREATE POLICY "Admin users can view all availability_single_date"
    ON public.availability_single_date
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. Allow admin users to manage all availability
CREATE POLICY "Admin users can manage all availability_single_date"
    ON public.availability_single_date
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
