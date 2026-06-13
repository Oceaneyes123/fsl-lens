create table if not exists signs (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  display_name text not null,
  type text not null check (type in ('alphabet', 'number', 'word')),
  modality text not null default 'static' check (modality in ('static', 'dynamic')),
  expected_hand_count integer not null check (expected_hand_count in (1, 2)),
  reference_image_url text,
  short_instruction text not null,
  common_mistakes text not null,
  is_active boolean not null default true
);

create table if not exists dynamic_samples (
  id uuid primary key default gen_random_uuid(),
  sign_id text not null,
  session_id text not null,
  frames_json jsonb not null,
  frame_count integer not null,
  fps numeric not null,
  hand_count integer not null check (hand_count in (1, 2)),
  handedness text[] not null default '{}',
  detector_confidence numeric not null,
  camera_type text not null,
  lighting_note text,
  quality_status text not null check (quality_status in ('clean', 'low_quality', 'rejected')),
  review_status text not null default 'pending',
  signer_id text,
  consent_raw_image boolean not null default false,
  raw_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists samples (
  id uuid primary key default gen_random_uuid(),
  sign_id text not null,
  session_id text not null,
  landmarks_json jsonb not null,
  hand_count integer not null,
  handedness text[] not null default '{}',
  detector_confidence numeric not null,
  camera_type text not null,
  lighting_note text,
  quality_status text not null check (quality_status in ('clean', 'low_quality', 'rejected')),
  review_status text not null default 'pending',
  consent_raw_image boolean not null default false,
  raw_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  predicted_sign_id text,
  expected_sign_id text,
  confidence numeric,
  top_predictions_json jsonb,
  was_correct boolean,
  sample_id uuid references samples(id),
  created_at timestamptz not null default now()
);

create table if not exists dataset_versions (
  id uuid primary key default gen_random_uuid(),
  version_name text not null,
  sample_count integer not null default 0,
  included_signs jsonb not null default '[]'::jsonb,
  split_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  notes text
);

create table if not exists model_versions (
  id uuid primary key default gen_random_uuid(),
  version_name text not null,
  dataset_version_id uuid references dataset_versions(id),
  model_type text not null,
  model_file_url text,
  accuracy numeric,
  per_sign_accuracy_json jsonb,
  confusion_matrix_json jsonb,
  threshold_config_json jsonb,
  status text not null check (status in ('draft', 'testing', 'active', 'archived')),
  created_at timestamptz not null default now(),
  notes text
);
