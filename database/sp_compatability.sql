CREATE TABLE public.sp_compatibility (
    id integer,
    song_id integer,
    state character varying(1024),
    key_mode character varying(1024),
    abc_modified text,
    compatability_json json,
    explored_json json,
    pitches integer[],
    incompatible_pitches integer[],
    inc_pitch_length integer,
    transposed_by integer
);

ALTER TABLE public.sp_compatibility OWNER TO sandbox_user;

CREATE SEQUENCE public.sp_compatibility_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.sp_compatibility_id_seq OWNER TO sandbox_user;

ALTER SEQUENCE public.sp_compatibility_id_seq OWNED BY public.sp_compatibility.id;

ALTER TABLE ONLY public.sp_compatibility ALTER COLUMN id SET DEFAULT nextval('public.sp_compatibility_id_seq'::regclass);

ALTER TABLE ONLY public.sp_compatibility
    ADD CONSTRAINT sp_compatibility_pkey PRIMARY KEY (id);
