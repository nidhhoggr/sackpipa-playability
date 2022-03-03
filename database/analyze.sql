SELECT filename, COUNT(*) FROM song WHERE state like 'compat%' AND key_mode != 'BOTH' GROUP BY filename HAVING COUNT(*) > 1;
