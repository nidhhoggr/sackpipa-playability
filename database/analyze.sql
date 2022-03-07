SELECT filename, COUNT(*) FROM song WHERE state like 'compat%' AND key_mode != 'BOTH' GROUP BY filename HAVING COUNT(*) > 1;

-- gets songs that have multiple ABC files associated with them on folkwiki
select ss.id, ss.fw_link_id, ss.note_sequence_count, ss.fw_page_count, ss.filename, sc.state from sp_song ss left join sp_compatibility sc on ss.id = sc.song_id where ss.fw_page_count > 1 and sc.state like 'compat%' and ss.note_sequence_count < 50 order by ss.fw_link_id, ss.note_sequence_count desc;
