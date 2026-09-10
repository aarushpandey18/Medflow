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

insert into storage.buckets (id, name, public) values ('prescription-files', 'prescription-files', false)
on conflict (id) do update set public = false;
