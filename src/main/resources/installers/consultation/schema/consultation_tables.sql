--consultation_encounter
CREATE SEQUENCE consultation_id_seq;
CREATE TABLE public.consultation
(
    id bigint NOT NULL DEFAULT nextval('consultation_id_seq'),
    uuid character varying(100),
	visit_id INTEGER,
	encounter_id INTEGER,
    patient_id integer,
	encounter_date date,
	visit_notes character varying(3000),
	
	created_by character varying(200),
	date_created TIMESTAMP,
	modified_by character varying(200),
	date_modified TIMESTAMP,
    PRIMARY KEY (id)
);

ALTER SEQUENCE consultation_id_seq OWNED BY consultation.id;


--consultation_complaint
CREATE SEQUENCE consultation_complaint_id_seq;
CREATE TABLE public.consultation_complaint
(
    id bigint NOT NULL DEFAULT nextval('consultation_complaint_id_seq'),
    uuid character varying(100),
    complaint character varying(3000),
	onset_date date, 
	severity integer,
	date_resolved date,
	consultation_id integer,
	
	created_by character varying(200),
	date_created TIMESTAMP,
	modified_by character varying(200),
	date_modified TIMESTAMP,
    PRIMARY KEY (id)
);
ALTER SEQUENCE consultation_complaint_id_seq OWNED BY consultation_complaint.id;


--consultation_diagnosis
CREATE SEQUENCE consultation_diagnosis_id_seq;
CREATE TABLE public.consultation_diagnosis
(
    id bigint NOT NULL DEFAULT nextval('consultation_diagnosis_id_seq'),
    uuid character varying(100),
    diagnosis character varying(3000),
	diagnosis_order integer,
	certainty integer,
	consultation_id integer,
	
	created_by character varying(200),
	date_created TIMESTAMP,
	modified_by character varying(200),
	date_modified TIMESTAMP,
    PRIMARY KEY (id)
);

ALTER SEQUENCE consultation_diagnosis_id_seq OWNED BY consultation_diagnosis.id;

delete from base_application_codeset where codeset_group='COMPLAINT_SEVERITY';
delete from base_application_codeset where codeset_group='DIAGNOSIS_ORDER';
delete from base_application_codeset where codeset_group='DIAGNOSIS_CERTAINTY';

insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '1', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '2', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '3', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '4', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '5', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '6', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '7', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '8', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '9', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'COMPLAINT_SEVERITY', '10', 'en', 1, '', '2022-04-25', '', 0);

insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'DIAGNOSIS_ORDER', 'Primary', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'DIAGNOSIS_ORDER', 'Secondary', 'en', 1, '', '2022-04-25', '', 0);

insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'DIAGNOSIS_CERTAINTY', 'Presumed', 'en', 1, '', '2022-04-25', '', 0);
insert into base_application_codeset(id, codeset_group, display, language, version, code, date_created, created_by, archived) values((SELECT MAX(id) + 1 FROM base_application_codeset), 'DIAGNOSIS_CERTAINTY', 'Confirmed', 'en', 1, '', '2022-04-25', '', 0);
