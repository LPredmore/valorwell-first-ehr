
-- This file contains test SQL for adding availability blocks
-- Run this in the Supabase SQL editor to add test availability blocks

-- Insert availability blocks for the current week
INSERT INTO availability_blocks (
  id, 
  clinician_id, 
  start_at, 
  end_at, 
  is_active, 
  created_at, 
  updated_at
)
VALUES 
-- Monday morning block (9am - 12pm)
(
  gen_random_uuid(), 
  '7df7c78d-d91f-4807-a2ef-42b46e922fa7',  -- Replace with your clinician_id
  (NOW()::date + interval '1 day' + interval '9 hours')::timestamptz,  -- 9am tomorrow 
  (NOW()::date + interval '1 day' + interval '12 hours')::timestamptz, -- 12pm tomorrow
  true, 
  NOW(), 
  NOW()
),
-- Monday afternoon block (1pm - 5pm)
(
  gen_random_uuid(), 
  '7df7c78d-d91f-4807-a2ef-42b46e922fa7',  -- Replace with your clinician_id
  (NOW()::date + interval '1 day' + interval '13 hours')::timestamptz, -- 1pm tomorrow
  (NOW()::date + interval '1 day' + interval '17 hours')::timestamptz, -- 5pm tomorrow
  true, 
  NOW(), 
  NOW()
),
-- Wednesday morning block (10am - 2pm)
(
  gen_random_uuid(), 
  '7df7c78d-d91f-4807-a2ef-42b46e922fa7',  -- Replace with your clinician_id
  (NOW()::date + interval '3 days' + interval '10 hours')::timestamptz, -- 10am Wednesday
  (NOW()::date + interval '3 days' + interval '14 hours')::timestamptz, -- 2pm Wednesday
  true, 
  NOW(), 
  NOW()
),
-- Friday full day block (9am - 5pm)
(
  gen_random_uuid(), 
  '7df7c78d-d91f-4807-a2ef-42b46e922fa7',  -- Replace with your clinician_id
  (NOW()::date + interval '5 days' + interval '9 hours')::timestamptz, -- 9am Friday
  (NOW()::date + interval '5 days' + interval '17 hours')::timestamptz, -- 5pm Friday 
  true, 
  NOW(), 
  NOW()
);
