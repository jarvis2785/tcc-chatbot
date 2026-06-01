CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  creator_type text,
  pain_point text,
  platform text,
  journey_stage text,
  instagram_handle text,
  created_at timestamp DEFAULT now()
);
