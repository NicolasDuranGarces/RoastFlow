--
-- PostgreSQL database dump
--

\restrict abDyblUQDOlr9PJmsYFCFKVzsqQuYRD82JmtqwQ5VGdCh7CpqI8EEcXjQSRjhex

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: coffeelot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coffeelot (
    farm_id integer NOT NULL,
    variety_id integer NOT NULL,
    process character varying NOT NULL,
    purchase_date date NOT NULL,
    green_weight_kg double precision NOT NULL,
    price_per_kg double precision NOT NULL,
    moisture_level double precision,
    notes character varying,
    id integer NOT NULL
);


ALTER TABLE public.coffeelot OWNER TO postgres;

--
-- Name: coffeelot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coffeelot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.coffeelot_id_seq OWNER TO postgres;

--
-- Name: coffeelot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coffeelot_id_seq OWNED BY public.coffeelot.id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    name character varying NOT NULL,
    contact_info character varying,
    id integer NOT NULL
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_id_seq OWNER TO postgres;

--
-- Name: customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_id_seq OWNED BY public.customer.id;


--
-- Name: expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense (
    expense_date date NOT NULL,
    category character varying NOT NULL,
    amount double precision NOT NULL,
    notes character varying,
    id integer NOT NULL
);


ALTER TABLE public.expense OWNER TO postgres;

--
-- Name: expense_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expense_id_seq OWNER TO postgres;

--
-- Name: expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_id_seq OWNED BY public.expense.id;


--
-- Name: farm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farm (
    name character varying NOT NULL,
    location character varying,
    notes character varying,
    id integer NOT NULL
);


ALTER TABLE public.farm OWNER TO postgres;

--
-- Name: farm_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.farm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.farm_id_seq OWNER TO postgres;

--
-- Name: farm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.farm_id_seq OWNED BY public.farm.id;


--
-- Name: roastbatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roastbatch (
    lot_id integer NOT NULL,
    roast_date date NOT NULL,
    green_input_kg double precision NOT NULL,
    roasted_output_kg double precision NOT NULL,
    roast_level character varying,
    notes character varying,
    id integer NOT NULL,
    shrinkage_pct double precision NOT NULL
);


ALTER TABLE public.roastbatch OWNER TO postgres;

--
-- Name: roastbatch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roastbatch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roastbatch_id_seq OWNER TO postgres;

--
-- Name: roastbatch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roastbatch_id_seq OWNED BY public.roastbatch.id;


--
-- Name: sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale (
    roast_batch_id integer NOT NULL,
    customer_id integer,
    sale_date date NOT NULL,
    quantity_kg double precision NOT NULL,
    price_per_kg double precision NOT NULL,
    notes character varying,
    id integer NOT NULL,
    total_price double precision NOT NULL
);


ALTER TABLE public.sale OWNER TO postgres;

--
-- Name: sale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sale_id_seq OWNER TO postgres;

--
-- Name: sale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_id_seq OWNED BY public.sale.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    email character varying(255) NOT NULL,
    full_name character varying,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    id integer NOT NULL,
    hashed_password character varying NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: variety; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.variety (
    name character varying NOT NULL,
    description character varying,
    id integer NOT NULL
);


ALTER TABLE public.variety OWNER TO postgres;

--
-- Name: variety_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.variety_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.variety_id_seq OWNER TO postgres;

--
-- Name: variety_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.variety_id_seq OWNED BY public.variety.id;


--
-- Name: coffeelot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coffeelot ALTER COLUMN id SET DEFAULT nextval('public.coffeelot_id_seq'::regclass);


--
-- Name: customer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer ALTER COLUMN id SET DEFAULT nextval('public.customer_id_seq'::regclass);


--
-- Name: expense id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense ALTER COLUMN id SET DEFAULT nextval('public.expense_id_seq'::regclass);


--
-- Name: farm id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm ALTER COLUMN id SET DEFAULT nextval('public.farm_id_seq'::regclass);


--
-- Name: roastbatch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roastbatch ALTER COLUMN id SET DEFAULT nextval('public.roastbatch_id_seq'::regclass);


--
-- Name: sale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale ALTER COLUMN id SET DEFAULT nextval('public.sale_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: variety id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variety ALTER COLUMN id SET DEFAULT nextval('public.variety_id_seq'::regclass);


--
-- Data for Name: coffeelot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coffeelot (farm_id, variety_id, process, purchase_date, green_weight_kg, price_per_kg, moisture_level, notes, id) FROM stdin;
1	1	Natural	2025-09-01	4	55000	\N		1
1	2	Semilavado	2025-09-01	4	40000	\N		2
1	1	Honey	2025-09-01	4	50000	\N		3
1	3	Lavado	2025-09-01	1	75000	\N		4
2	4	Lavado	2025-09-01	1	35000	10		5
3	4	Lavado	2025-09-19	10	37000	11		6
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer (name, contact_info, id) FROM stdin;
Sara Lucía	3213650900	1
Jorge Bedoya	3244455002	2
Jóse Miguel Cruz	3156825658	3
María Victoria Quintas Castellana	3042070213	4
Danny Musica	3197350696	5
Daniela Anttury	3205094943	6
Caturro Cafe	3057970008	7
\.


--
-- Data for Name: expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense (expense_date, category, amount, notes, id) FROM stdin;
\.


--
-- Data for Name: farm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.farm (name, location, notes, id) FROM stdin;
Corazon	Genova, Quindío	Laura Rojas	2
El Girasol 	Genova, Quindio	Robinson	1
San Remo	Circasia, Quindio		3
\.


--
-- Data for Name: roastbatch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roastbatch (lot_id, roast_date, green_input_kg, roasted_output_kg, roast_level, notes, id, shrinkage_pct) FROM stdin;
1	2025-09-06	4	3.28	Medio		2	18.000000000000004
2	2025-09-06	4	3.28	Medio		3	18.000000000000004
3	2025-09-06	4	3.28	Medio		4	18.000000000000004
4	2025-09-06	1	0.82	Medio		5	18.000000000000004
5	2025-09-06	1	0.82	Alto		6	18.000000000000004
6	2025-09-23	10	8.72	Medio Ligero		7	12.799999999999995
\.


--
-- Data for Name: sale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale (roast_batch_id, customer_id, sale_date, quantity_kg, price_per_kg, notes, id, total_price) FROM stdin;
4	2	2025-09-18	2	144000		1	288000
3	2	2025-09-18	2	104000		2	208000
2	1	2025-09-18	0.25	160000		3	40000
3	3	2025-09-18	0.5	104000		5	52000
3	5	2025-09-18	0.25	120000		4	30000
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (email, full_name, is_active, is_superuser, id, hashed_password) FROM stdin;
admin@caturro.cafe	Admin	t	t	1	$2b$12$V6HozFnAXhO54uWi2WNZiOmSbI2TZvyYmILRYFTWGwOulgByZATki
distintoespacial@gmail.com	Distinto	t	t	2	$2b$12$hvUy.dzAnxsm5uiJABj1ueRXWOTKw8s9NJG7zZ0wig065QIybmKni
\.


--
-- Data for Name: variety; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.variety (name, description, id) FROM stdin;
Variedad Colombia		1
Blend (Castillo/Cenicafe1)		2
Gesha		3
Castillo		4
\.


--
-- Name: coffeelot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coffeelot_id_seq', 6, true);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_id_seq', 7, true);


--
-- Name: expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_id_seq', 1, false);


--
-- Name: farm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.farm_id_seq', 3, true);


--
-- Name: roastbatch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roastbatch_id_seq', 7, true);


--
-- Name: sale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_id_seq', 5, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 2, true);


--
-- Name: variety_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.variety_id_seq', 4, true);


--
-- Name: coffeelot coffeelot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coffeelot
    ADD CONSTRAINT coffeelot_pkey PRIMARY KEY (id);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: expense expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_pkey PRIMARY KEY (id);


--
-- Name: farm farm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm
    ADD CONSTRAINT farm_pkey PRIMARY KEY (id);


--
-- Name: roastbatch roastbatch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roastbatch
    ADD CONSTRAINT roastbatch_pkey PRIMARY KEY (id);


--
-- Name: sale sale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale
    ADD CONSTRAINT sale_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: variety variety_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variety
    ADD CONSTRAINT variety_pkey PRIMARY KEY (id);


--
-- Name: ix_farm_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_farm_name ON public.farm USING btree (name);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: ix_variety_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_variety_name ON public.variety USING btree (name);


--
-- Name: coffeelot coffeelot_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coffeelot
    ADD CONSTRAINT coffeelot_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farm(id);


--
-- Name: coffeelot coffeelot_variety_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coffeelot
    ADD CONSTRAINT coffeelot_variety_id_fkey FOREIGN KEY (variety_id) REFERENCES public.variety(id);


--
-- Name: roastbatch roastbatch_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roastbatch
    ADD CONSTRAINT roastbatch_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.coffeelot(id);


--
-- Name: sale sale_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale
    ADD CONSTRAINT sale_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- Name: sale sale_roast_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale
    ADD CONSTRAINT sale_roast_batch_id_fkey FOREIGN KEY (roast_batch_id) REFERENCES public.roastbatch(id);


--
-- PostgreSQL database dump complete
--

\unrestrict abDyblUQDOlr9PJmsYFCFKVzsqQuYRD82JmtqwQ5VGdCh7CpqI8EEcXjQSRjhex

