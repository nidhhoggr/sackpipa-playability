CREATE TABLE public.sp_song (
    id integer,
    fw_link_id integer,
    abc text,
    abc_name varchar(1024),
    note_sequence_count integer,
    fw_page_count integer,
    exclusively_incompatible boolean
);

ALTER TABLE public.sp_song OWNER TO sandbox_user;

CREATE SEQUENCE public.sp_song_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.sp_song_id_seq OWNER TO sandbox_user;

ALTER SEQUENCE public.sp_song_id_seq OWNED BY public.sp_song.id;

ALTER TABLE ONLY public.sp_song ALTER COLUMN id SET DEFAULT nextval('public.sp_song_id_seq'::regclass);

ALTER TABLE ONLY public.sp_song
    ADD CONSTRAINT sp_song_pkey PRIMARY KEY (id);
