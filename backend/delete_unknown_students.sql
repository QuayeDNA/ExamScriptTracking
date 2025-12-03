-- Delete students with Unknown data
DELETE FROM "Student" WHERE "firstName" = 'Unknown' AND "lastName" = 'Unknown';
