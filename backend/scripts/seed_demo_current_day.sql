-- See My Mind demo snapshot for Supabase
--
-- Run this script in the Supabase SQL Editor whenever you want a coherent
-- current-day demo state. It is intentionally limited to the four named demo
-- pupils and only refreshes rows marked recording_method = 'demo_seed' or
-- reporter_name = 'Demo family handover'. Real staff-recorded rows are left
-- untouched.

BEGIN;

DO $$
DECLARE
    pupil RECORD;
    teacher_id UUID;
    handover_event_id UUID;
    now_utc TIMESTAMPTZ := timezone('utc', now());
    today_date DATE := (timezone('utc', now()))::date;
    arrival_status TEXT;
    arrival_hour INTEGER;
    arrival_minute INTEGER;
    arrival_note TEXT;
    pupil_mood TEXT;
    pupil_sleep TEXT;
    pupil_breakfast BOOLEAN;
    pupil_medication BOOLEAN;
BEGIN
    SELECT id
    INTO teacher_id
    FROM staff_members
    WHERE lower(first_name) = 'clara'
      AND lower(last_name) = 'johnson'
    ORDER BY active DESC, created_at
    LIMIT 1;

    FOR pupil IN
        SELECT id, first_name, last_name, school_id
        FROM children
        WHERE active = true
          AND (
            (first_name = 'Phoenix' AND last_name = 'Carter') OR
            (first_name = 'Archie' AND last_name = 'Watson') OR
            (first_name = 'Riya' AND last_name = 'Patel') OR
            (first_name = 'Leo' AND last_name = 'Campbell')
          )
    LOOP
        arrival_status := CASE pupil.first_name
            WHEN 'Archie' THEN 'late'
            ELSE 'present'
        END;
        arrival_hour := CASE pupil.first_name
            WHEN 'Phoenix' THEN 8
            WHEN 'Archie' THEN 9
            WHEN 'Riya' THEN 8
            ELSE 8
        END;
        arrival_minute := CASE pupil.first_name
            WHEN 'Phoenix' THEN 42
            WHEN 'Archie' THEN 3
            WHEN 'Riya' THEN 51
            ELSE 47
        END;
        arrival_note := CASE pupil.first_name
            WHEN 'Phoenix' THEN 'Arrived with visual timetable and headphones ready.'
            WHEN 'Archie' THEN 'Late arrival recorded by classroom staff; settled after movement break.'
            WHEN 'Riya' THEN 'Calm handover; requested a quiet seat before maths.'
            ELSE 'Used the visual arrival card and joined the morning check-in.'
        END;
        pupil_mood := CASE pupil.first_name
            WHEN 'Phoenix' THEN 'Calm'
            WHEN 'Archie' THEN 'High energy'
            WHEN 'Riya' THEN 'Calm'
            ELSE 'Ready'
        END;
        pupil_sleep := CASE pupil.first_name
            WHEN 'Archie' THEN 'Restless'
            ELSE 'Good'
        END;
        pupil_breakfast := true;
        pupil_medication := CASE pupil.first_name
            WHEN 'Phoenix' THEN true
            ELSE NULL
        END;

        -- Arrival: update only a previous demo row. A real staff row wins.
        UPDATE child_arrivals
        SET school_id = pupil.school_id,
            status = arrival_status,
            arrived_at = date_trunc('day', now_utc)
                         + make_interval(hours => arrival_hour, mins => arrival_minute),
            recorded_by = teacher_id,
            recorded_by_name = 'Clara Johnson',
            recorded_by_role = 'teacher',
            recording_method = 'demo_seed',
            notes = arrival_note,
            updated_at = now_utc
        WHERE child_id = pupil.id
          AND arrival_date = today_date
          AND recording_method = 'demo_seed';

        IF NOT FOUND THEN
            INSERT INTO child_arrivals (
                id, child_id, school_id, arrival_date, status, arrived_at,
                recorded_by, recorded_by_name, recorded_by_role,
                recording_method, notes, created_at, updated_at
            )
            VALUES (
                gen_random_uuid(), pupil.id, pupil.school_id, today_date,
                arrival_status,
                date_trunc('day', now_utc)
                    + make_interval(hours => arrival_hour, mins => arrival_minute),
                teacher_id, 'Clara Johnson', 'teacher', 'demo_seed',
                arrival_note, now_utc, now_utc
            )
            ON CONFLICT (child_id, arrival_date) DO NOTHING;
        END IF;

        -- Parent home check-in / handover. The date in the title makes this
        -- one current, repeatable demo record per pupil per day.
        SELECT id
        INTO handover_event_id
        FROM child_events
        WHERE child_id = pupil.id
          AND title = 'Demo morning handover ' || today_date::text
        LIMIT 1;

        IF handover_event_id IS NULL THEN
            handover_event_id := gen_random_uuid();
            INSERT INTO child_events (
                id, child_id, school_id, event_time, event_type,
                reporter_type, reporter_name, title, summary, significance,
                visibility, status, created_at, updated_at
            )
            VALUES (
                handover_event_id, pupil.id, pupil.school_id,
                date_trunc('day', now_utc) + interval '8 hours 20 minutes',
                'Transition', 'Parent', 'Demo family handover',
                'Demo morning handover ' || today_date::text,
                arrival_note,
                CASE WHEN arrival_status = 'present' THEN 'Routine' ELSE 'Concern' END,
                'Shared', 'Acknowledged', now_utc, now_utc
            );
        ELSE
            UPDATE child_events
            SET event_time = date_trunc('day', now_utc) + interval '8 hours 20 minutes',
                school_id = pupil.school_id,
                summary = arrival_note,
                status = 'Acknowledged',
                updated_at = now_utc
            WHERE id = handover_event_id
              AND reporter_name = 'Demo family handover';
        END IF;

        UPDATE transition_logs
        SET transition_type = 'Morning Handover (Home)',
            sleep_quality = pupil_sleep,
            morning_mood = pupil_mood,
            breakfast_eaten = pupil_breakfast,
            medication_given = pupil_medication,
            special_notes_for_day = arrival_note,
            acknowledged_by_staff = true,
            acknowledged_at = date_trunc('day', now_utc) + interval '8 hours 35 minutes',
            updated_at = now_utc
        WHERE transition_logs.event_id = handover_event_id;

        IF NOT FOUND THEN
            INSERT INTO transition_logs (
                id, event_id, transition_type, sleep_quality, morning_mood,
                breakfast_eaten, medication_given, special_notes_for_day,
                acknowledged_by_staff, acknowledged_at, created_at, updated_at
            )
            VALUES (
                gen_random_uuid(), handover_event_id, 'Morning Handover (Home)',
                pupil_sleep, pupil_mood, pupil_breakfast, pupil_medication,
                arrival_note, true,
                date_trunc('day', now_utc) + interval '8 hours 35 minutes',
                now_utc, now_utc
            );
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Verification: each selected pupil should have a present/late arrival and an
-- acknowledged current-day home handover after the script completes.
SELECT
    c.first_name || ' ' || c.last_name AS pupil,
    ca.status AS arrival_status,
    ca.arrived_at,
    ce.event_time AS handover_time,
    tl.acknowledged_by_staff,
    tl.acknowledged_at
FROM children c
LEFT JOIN child_arrivals ca
    ON ca.child_id = c.id
   AND ca.arrival_date = (timezone('utc', now()))::date
LEFT JOIN child_events ce
    ON ce.child_id = c.id
   AND ce.title = 'Demo morning handover ' || (timezone('utc', now()))::date::text
LEFT JOIN transition_logs tl ON tl.event_id = ce.id
WHERE (c.first_name, c.last_name) IN (
    ('Phoenix', 'Carter'), ('Archie', 'Watson'),
    ('Riya', 'Patel'), ('Leo', 'Campbell')
)
ORDER BY pupil;
