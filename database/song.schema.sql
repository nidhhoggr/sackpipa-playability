CREATE TABLE public.song (
    id integer,
    filename character varying(1024),
    state character varying(1024),
    key_mode character varying(1024),
    abc_orig text,
    abc_modf text,
    compatability_json json,
    explored_json json,
    pitches integer[],
    incompatible_pitches integer[]
);

ALTER TABLE public.song OWNER TO sandbox_user;

CREATE SEQUENCE public.song_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.song_id_seq OWNER TO sandbox_user;

ALTER SEQUENCE public.song_id_seq OWNED BY public.song.id;

ALTER TABLE ONLY public.song ALTER COLUMN id SET DEFAULT nextval('public.song_id_seq'::regclass);

ALTER TABLE ONLY public.song
    ADD CONSTRAINT song_pkey PRIMARY KEY (id);
