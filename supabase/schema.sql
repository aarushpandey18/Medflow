create table if not exists public.prescriptions (
  prescription_id text primary key,
  patient_name text not null,
  patient_id text not null,
  medicine text not null,
  dosage text not null,
  doctor_name text not null,
  notes text not null default '',
  verified boolean not null default true,
  document_name text,
  document_url text,
  created_at timestamptz not null default now()
);

create index if not exists prescriptions_created_at_idx on public.prescriptions (created_at desc);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'doctor', 'patient', 'staff')),
  phone text,
  specialty text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id text primary key,
  patient_id text not null references public.users(id) on delete cascade,
  doctor_id text not null references public.users(id) on delete cascade,
  appointment_date timestamptz not null,
  reason text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_date_idx on public.appointments (appointment_date);
create index if not exists appointments_patient_idx on public.appointments (patient_id);
create index if not exists appointments_doctor_idx on public.appointments (doctor_id);

create table if not exists public.doctor_availability (
  id text primary key,
  doctor_id text not null references public.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, day_of_week, start_time, end_time)
);

create table if not exists public.patient_records (
  id text primary key,
  patient_id text not null references public.users(id) on delete cascade,
  record_type text not null default 'general',
  title text not null,
  details text not null default '',
  record_date timestamptz not null default now(),
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists patient_records_patient_idx on public.patient_records (patient_id, record_date desc);

insert into storage.buckets (id, name, public) values ('prescription-files', 'prescription-files', false)
on conflict (id) do update set public = false;
