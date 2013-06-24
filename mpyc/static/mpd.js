var SECS_DAY = 86400;
var SECS_HOUR = 3600;
var SECS_MIN = 60;
var SECS_SEC = 1;
var DURATION_SECS = [SECS_DAY, SECS_HOUR, SECS_MIN, SECS_SEC];
var DURATION_LONG_STR = ['d ', 'h ', 'm ', 's'];
var DURATION_SHORT_STR = [':', ':', ':', ''];
var MPD_STATES = {
	'play': 'playing',
	'stop': 'stopped',
	'pause': 'paused',
};

function duration(secs, longFormat) {
	var str = '';
	for (var i in DURATION_SECS) {
		var show = false;
		var num = parseInt(secs / DURATION_SECS[i]);

		secs -= num * DURATION_SECS[i];

		if (longFormat) {
			var show = (num != 0);
			str += show ? num + DURATION_LONG_STR[i] : '';
		}
		else {
			// Pad with a zero.
			if (i > 0 && num < 10) {
				num = '0' + num;
			}
			// Show this number if > 0 and force it to show
			// if it's a minutes or a seconds number.
			var show = (num != 0 || i > 1)
			str += show ? num + DURATION_SHORT_STR[i] : '';
		}
	}
	return str;
}

// Highlights the current track in the playlist and displays current song info.
function mpd_currentsong_show(complete, data) {
	if (!complete) {
		return;
	}
	var current_pos = data['pos'];
	$('#playlist-pos-' + current_pos).addClass('track-current');

	$('#mpd-current-album-text').html('--| <span class="track-album-color">' + data['album'] + '</span> |--');
	$('#mpd-current-track-text').html('<span class="track-artist-color">' + data['artist'] + '</span> - <span class="track-title-color">' + data['title'] + '</span> (' + data['date'] + ')');
}

function mpd_playlistinfo_show(complete, data) {
	if (!complete) {
		return;
	}
	var html = '';
	var total_time = 0;
	for (var i = 0; i < data.length; i++) {
		var current = data[i];
		total_time = total_time + parseInt(current['time']);
		html += '<tr class="playlist-pos" id="playlist-pos-'+ current['pos'] +'">';
		html += '<td class="track-time track-time-color">'+ duration(current['time']) +'</div>';
		//html += '<td class="track-artist track-artist-color">'+ current['artist'].substring(0, 32) +'</div>';
		//html += '<td class="track-title track-title-color">'+ current['title'].substring(0, 64) +'</div>';
		html += '<td class="track-artist track-artist-color">'+ current['artist'] +'</div>';
		html += '<td class="track-title track-title-color">'+ current['title'] +'</div>';
		html += '<td class="track-album track-album-color">'+ current['album'] +'</div>';
		html += '</tr>';
	}
	$('#mpd-playlist-table').append(html);
	$('#mpd-playlist-items-text').html(data.length);
	$('#mpd-playlist-length-text').html(duration(total_time, true));
}

function mpd_stats_show(complete, data) {
	if (!complete) {
		return;
	}
	var html = 'Artists: '+ data['artists'] +'<br/>';
	html += 'Albums: '+ data['albums'] +'<br/>';
	html += 'Songs: '+ data['songs'] +'<br/>';
	html += 'Playlist time: '+ duration(data['playtime'], true) +'<br/>';
	$('#mpd-stats-text').html(html);
}

function mpd_status_show(complete, data) {
	if (!complete) {
		return;
	}
	$('#mpd-status-text').html('['+ MPD_STATES[data['state']] +']');

	var volume_text = 'Vol: ';
	if (data['volume'] == '-1') {
		volume_text += 'N/A';
	}
	else {
		volume_text += data['volume'];
	}
	$('#mpd-volume-text').html(volume_text);

	var times = data['time'].split(':');
	var current_time_str = duration(times[0]) + '/' + duration(times[1]);
	$('#mpd-current-time-text').html(current_time_str);
}

var mpd_command_handler = {
	'currentsong': mpd_currentsong_show,
	'playlistinfo': mpd_playlistinfo_show,
	'stats': mpd_stats_show,
	'status': mpd_status_show,
};

function mpd_execute(command) {
	var handler = mpd_command_handler[command];
	if (handler === undefined) {
		return;
	}
	var req = {
		url: '/mpd/'+command+'.json',
		data: null,
		type: 'GET',
		cache: false,
		dataType: 'json',
		beforeSend: function(data, textStatus, errorThrown) {
			handler(false, 'Fetching');
		},
		success: function(data, textStatus, errorThrown) {
			handler(true, data);
		},
		error: function(data, textStatus, errorThrown) {
			alert("Aww: "+textStatus+": "+errorThrown);
		},
		complete: function(data, textStatus, errorThrown) {
			// Some commands need followups. Like the playlistinfo command.
			switch (command) {
				case "playlistinfo":
					mpd_execute('currentsong');
					break;
				default:
					break;
			}
		},
	}
	$.ajax(req);
}

function mpd_get_info() {
	//mpd_execute('stats');
	mpd_execute('status');
	mpd_execute('playlistinfo');
}

$(document).ready(mpd_get_info);