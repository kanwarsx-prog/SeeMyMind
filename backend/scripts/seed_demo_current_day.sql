-- See My Mind demo snapshot for Supabase
--
-- Run this script in the Supabase SQL Editor whenever you want a coherent
-- current-day demo state. It is intentionally limited to the four named demo
-- pupils and only refreshes rows marked recording_method = 'demo_seed' or
-- source markers such as recording_method = 'demo_seed'. Real staff-recorded rows are left
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
          AND title IN (
              'Demo morning handover ' || today_date::text,
              'Morning Home Handover ' || today_date::text
          )
          AND reporter_name IN ('Demo family handover', 'Parent / Carer')
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
                'Transition', 'Parent', 'Parent / Carer',
                'Morning Home Handover ' || today_date::text,
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
              AND reporter_name IN ('Demo family handover', 'Parent / Carer');
            UPDATE child_events
            SET title = 'Morning Home Handover ' || today_date::text,
                reporter_name = 'Parent / Carer',
                updated_at = now_utc
            WHERE id = handover_event_id;
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

-- Historical weekday evidence for trend reporting. The current day above is
-- kept separate; this block adds the preceding 14 calendar days, skipping
-- weekends because no classroom session takes place on those dates.
BEGIN;

DO $$
DECLARE
    pupil RECORD;
    day_offset INTEGER;
    day_date DATE;
    day_start TIMESTAMPTZ;
    now_utc TIMESTAMPTZ := timezone('utc', now());
    handover_event_id UUID;
    observation_event_id UUID;
    incident_event_id UUID;
    arrival_note TEXT;
    pupil_mood TEXT;
    pupil_sleep TEXT;
    pupil_breakfast BOOLEAN;
    pupil_medication BOOLEAN;
    strategy_name TEXT;
    activity_name TEXT;
    observation_summary TEXT;
    strategy_worked BOOLEAN;
    should_incident BOOLEAN;
BEGIN
    FOR day_offset IN 0..14 LOOP
        day_date := ((timezone('utc', now()))::date - day_offset);

        IF extract(isodow FROM day_date) BETWEEN 1 AND 5 THEN
            day_start := day_date::timestamp AT TIME ZONE 'UTC';

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
                pupil_mood := CASE
                    WHEN pupil.first_name = 'Phoenix' AND day_offset % 5 = 0 THEN 'Tired'
                    WHEN pupil.first_name = 'Archie' AND day_offset % 4 = 0 THEN 'High energy'
                    WHEN pupil.first_name = 'Riya' AND day_offset % 6 = 0 THEN 'Worried'
                    WHEN pupil.first_name = 'Leo' AND day_offset % 7 = 0 THEN 'Quiet'
                    ELSE 'Calm'
                END;
                pupil_sleep := CASE
                    WHEN day_offset % 5 = 0 THEN 'Restless'
                    ELSE 'Good'
                END;
                pupil_breakfast := day_offset % 5 <> 0 OR pupil.first_name = 'Riya';
                pupil_medication := CASE
                    WHEN pupil.first_name = 'Phoenix' THEN true
                    ELSE NULL
                END;
                arrival_note := CASE
                    WHEN pupil_mood IN ('Tired', 'Worried') THEN 'Home reported a slower start; visual timetable and a calm arrival were planned.'
                    WHEN pupil.first_name = 'Archie' AND day_offset % 4 = 0 THEN 'Late arrival recorded; movement break used before the first task.'
                    ELSE 'Morning handover received; pupil arrived with their agreed classroom supports.'
                END;

                INSERT INTO child_arrivals (
                    id, child_id, school_id, arrival_date, status, arrived_at,
                    recorded_by_name, recorded_by_role, recording_method,
                    notes, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), pupil.id, pupil.school_id, day_date,
                    CASE WHEN pupil.first_name = 'Archie' AND day_offset % 4 = 0 THEN 'late' ELSE 'present' END,
                    day_start + make_interval(hours => 8 + CASE WHEN pupil.first_name = 'Archie' AND day_offset % 4 = 0 THEN 1 ELSE 0 END,
                                               mins => 42 + ((day_offset * 7) % 16)),
                    'Clara Johnson', 'teacher', 'demo_seed', arrival_note, now_utc, now_utc
                )
                ON CONFLICT (child_id, arrival_date) DO UPDATE
                SET status = EXCLUDED.status,
                    arrived_at = EXCLUDED.arrived_at,
                    recorded_by_name = EXCLUDED.recorded_by_name,
                    recorded_by_role = EXCLUDED.recorded_by_role,
                    recording_method = EXCLUDED.recording_method,
                    notes = EXCLUDED.notes,
                    updated_at = now_utc
                WHERE child_arrivals.recording_method = 'demo_seed';

                SELECT id
                INTO handover_event_id
                FROM child_events
                WHERE child_id = pupil.id
                  AND title IN (
                      'Demo morning handover ' || day_date::text,
                      'Morning Home Handover ' || day_date::text
                  )
                  AND reporter_name IN ('Demo family handover', 'Parent / Carer')
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
                        day_start + interval '8 hours 20 minutes', 'Transition',
                        'Parent', 'Parent / Carer',
                        'Morning Home Handover ' || day_date::text,
                        arrival_note,
                        CASE WHEN pupil_mood IN ('Tired', 'Worried') THEN 'Concern' ELSE 'Routine' END,
                        'Shared', 'Acknowledged', now_utc, now_utc
                    );
                END IF;

                UPDATE child_events
                SET title = 'Morning Home Handover ' || day_date::text,
                    reporter_name = 'Parent / Carer',
                    updated_at = now_utc
                WHERE id = handover_event_id;

                INSERT INTO transition_logs (
                    id, event_id, transition_type, sleep_quality, morning_mood,
                    breakfast_eaten, medication_given, special_notes_for_day,
                    acknowledged_by_staff, acknowledged_at, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), handover_event_id, 'Morning Handover (Home)',
                    pupil_sleep, pupil_mood, pupil_breakfast, pupil_medication,
                    arrival_note, true, day_start + interval '8 hours 35 minutes',
                    now_utc, now_utc
                )
                ON CONFLICT (event_id) DO UPDATE
                SET sleep_quality = EXCLUDED.sleep_quality,
                    morning_mood = EXCLUDED.morning_mood,
                    breakfast_eaten = EXCLUDED.breakfast_eaten,
                    medication_given = EXCLUDED.medication_given,
                    special_notes_for_day = EXCLUDED.special_notes_for_day,
                    acknowledged_by_staff = true,
                    acknowledged_at = EXCLUDED.acknowledged_at,
                    updated_at = now_utc;

                strategy_name := CASE (day_offset + length(pupil.first_name)) % 4
                    WHEN 0 THEN 'Visual Task Strip / 5-Min Timer'
                    WHEN 1 THEN 'Purposeful Movement Break'
                    WHEN 2 THEN 'Noise-Cancelling Headphones'
                    ELSE 'Visual Prompt Cards'
                END;
                activity_name := CASE (day_offset + length(pupil.last_name)) % 4
                    WHEN 0 THEN 'Maths Independent Task'
                    WHEN 1 THEN 'Science Practical'
                    WHEN 2 THEN 'Assembly Transition'
                    ELSE 'Literacy Small Group'
                END;
                strategy_worked := NOT (
                    (pupil.first_name = 'Phoenix' AND day_offset % 7 = 0) OR
                    (pupil.first_name = 'Archie' AND day_offset % 6 = 0)
                );
                observation_summary := CASE
                    WHEN strategy_worked THEN 'Participated with the recorded support and returned to the learning task.'
                    ELSE 'Needed additional adult support before re-engaging with the task.'
                END;

                SELECT id
                INTO observation_event_id
                FROM child_events
                WHERE child_id = pupil.id
                  AND title IN (
                      'Demo classroom observation ' || day_date::text,
                      'Classroom Observation ' || day_date::text
                  )
                  AND reporter_name IN ('Demo seed', 'Melissa Grant')
                LIMIT 1;

                IF observation_event_id IS NULL THEN
                    observation_event_id := gen_random_uuid();
                    INSERT INTO child_events (
                        id, child_id, school_id, event_time, event_type,
                        reporter_type, reporter_name, title, summary, significance,
                        visibility, status, created_at, updated_at
                    )
                    VALUES (
                        observation_event_id, pupil.id, pupil.school_id,
                        day_start + interval '11 hours 15 minutes', 'Observation',
                        'TA', 'Melissa Grant',
                        'Classroom Observation ' || day_date::text,
                        observation_summary,
                        CASE WHEN strategy_worked THEN 'Notable Win' ELSE 'Concern' END,
                        'Shared', 'Logged', now_utc, now_utc
                    );
                END IF;

                UPDATE child_events
                SET title = 'Classroom Observation ' || day_date::text,
                    reporter_name = 'Melissa Grant',
                    updated_at = now_utc
                WHERE id = observation_event_id;

                INSERT INTO observations (
                    id, event_id, activity_context, engagement_level, strategy_used,
                    strategy_worked, strengths_observed, notes, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), observation_event_id, activity_name,
                    CASE WHEN strategy_worked THEN 'High' ELSE 'Engaged with Support' END,
                    strategy_name, strategy_worked,
                    CASE WHEN strategy_worked THEN 'Used agreed visual or sensory support' ELSE NULL END,
                    observation_summary, now_utc, now_utc
                )
                ON CONFLICT (event_id) DO UPDATE
                SET activity_context = EXCLUDED.activity_context,
                    engagement_level = EXCLUDED.engagement_level,
                    strategy_used = EXCLUDED.strategy_used,
                    strategy_worked = EXCLUDED.strategy_worked,
                    strengths_observed = EXCLUDED.strengths_observed,
                    notes = EXCLUDED.notes,
                    updated_at = now_utc;

                should_incident :=
                    (pupil.first_name = 'Phoenix' AND day_offset IN (4, 9, 13)) OR
                    (pupil.first_name = 'Archie' AND day_offset = 6) OR
                    (pupil.first_name = 'Riya' AND day_offset = 3) OR
                    (pupil.first_name = 'Leo' AND day_offset = 8);

                IF should_incident THEN
                    SELECT id
                    INTO incident_event_id
                    FROM child_events
                    WHERE child_id = pupil.id
                      AND title IN (
                          'Demo recorded regulation incident ' || day_date::text,
                          'Regulation Incident ' || day_date::text
                      )
                      AND reporter_name IN ('Demo seed', 'Clara Johnson')
                    LIMIT 1;

                    IF incident_event_id IS NULL THEN
                        incident_event_id := gen_random_uuid();
                        INSERT INTO child_events (
                            id, child_id, school_id, event_time, event_type,
                            reporter_type, reporter_name, title, summary, significance,
                            visibility, status, created_at, updated_at
                        )
                        VALUES (
                            incident_event_id, pupil.id, pupil.school_id,
                            day_start + interval '10 hours 25 minutes', 'Incident',
                            'Teacher', 'Clara Johnson',
                            'Regulation Incident ' || day_date::text,
                            'A recorded transition or task demand increased regulation needs; the pupil recovered with their agreed support.',
                            'Concern', 'Shared', 'Reviewed', now_utc, now_utc
                        );
                    END IF;

                    UPDATE child_events
                    SET title = 'Regulation Incident ' || day_date::text,
                        reporter_name = 'Clara Johnson',
                        updated_at = now_utc
                    WHERE id = incident_event_id;

                    INSERT INTO behavioural_incidents (
                        id, event_id, location, severity, antecedent, behaviour,
                        consequence, de_escalation_strategy_used, recovery_time_minutes,
                        parent_notified, created_at, updated_at
                    )
                    VALUES (
                        gen_random_uuid(), incident_event_id, 'Classroom transition',
                        'Moderate', 'Unexpected demand or busy transition.',
                        'Showed visible signs of dysregulation and paused participation.',
                        'Adult reduced the demand, offered the recorded strategy, and supported a gradual return.',
                        strategy_name, 8 + (day_offset % 7), true, now_utc, now_utc
                    )
                    ON CONFLICT (event_id) DO UPDATE
                    SET location = EXCLUDED.location,
                        severity = EXCLUDED.severity,
                        antecedent = EXCLUDED.antecedent,
                        behaviour = EXCLUDED.behaviour,
                        consequence = EXCLUDED.consequence,
                        de_escalation_strategy_used = EXCLUDED.de_escalation_strategy_used,
                        recovery_time_minutes = EXCLUDED.recovery_time_minutes,
                        parent_notified = EXCLUDED.parent_notified,
                        updated_at = now_utc;
                END IF;
            END LOOP;
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
   AND ce.title = 'Morning Home Handover ' || (timezone('utc', now()))::date::text
LEFT JOIN transition_logs tl ON tl.event_id = ce.id
WHERE (c.first_name, c.last_name) IN (
    ('Phoenix', 'Carter'), ('Archie', 'Watson'),
    ('Riya', 'Patel'), ('Leo', 'Campbell')
)
ORDER BY pupil;

-- Trend coverage summary for the seeded window.
SELECT
    COUNT(DISTINCT ce.event_time::date) FILTER (WHERE ce.event_type = 'Transition') AS handover_days,
    COUNT(DISTINCT ce.event_time::date) FILTER (WHERE ce.event_type = 'Observation') AS observation_days,
    COUNT(*) FILTER (WHERE ce.event_type = 'Incident') AS incident_count,
    COUNT(*) FILTER (WHERE ce.event_type = 'Observation' AND o.strategy_worked = true) AS successful_observations
FROM child_events ce
LEFT JOIN observations o ON o.event_id = ce.id
WHERE ce.title LIKE 'Morning Home Handover %'
   OR ce.title LIKE 'Classroom Observation %'
   OR ce.title LIKE 'Regulation Incident %'
  AND ce.event_time >= (timezone('utc', now()))::date - 14
  AND ce.event_time < (timezone('utc', now()))::date + 1;
