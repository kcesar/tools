CREATE TABLE ols (
k INTEGER PRIMARY KEY,
named VARCHAR(50),
callsign VARCHAR(15),
phone VARCHAR(15)
);

CREATE TABLE comms (
k INTEGER PRIMARY KEY,
named VARCHAR(50),
callsign VARCHAR(15),
phone VARCHAR(15)
);

CREATE TABLE drivers (
k INTEGER PRIMARY KEY,
named VARCHAR(50)
);

INSERT INTO drivers VALUES (NULL, 'Any willing qualified driver');

CREATE TABLE duty_rotation (
k INTEGER PRIMARY KEY,
start_date DATE,
ol INT,
comm INT,
van INT
);
