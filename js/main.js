// google sheet URL:  https://docs.google.com/spreadsheets/d/1XdNtwjMTO_tAaVRVr8UH-SL_qovIv9DYBGFRl5IyqnY/edit#gid=0
var sheetID = "1XdNtwjMTO_tAaVRVr8UH-SL_qovIv9DYBGFRl5IyqnY";
var data;
var list_template_html;
var list_template;
var onlanding = 1;
var map_showing = 0;
var iconElement = [];
var overlays = [];

Handlebars.registerHelper("formatBodyText", function(t) {
	t = t.trim();
	var re = new RegExp('[\r\n]+', 'g');
    return (t.length>0?'<p>'+t.replace(re,'</p><p>')+'</p>':null);
});

var iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    src: 'icon/place-icon.svg',
    scale: 0.2,
  }))
});

var selectedStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    src: 'icon/place-icon-color.svg',
    scale: 0.2,
  }))
});

var map;

// $( window ).hashchange(function() {
// 			    var hash = location.hash;
// 			 	hide_landing();
			   	
			    
// 			});

$(document).ready(function() {
	// Landing page switcher
	$("#closelanding").click(function() { hide_landing(); });

	$("#landing").swipe({
		swipeUp:function(event,direction,distance,duration) {
			hide_landing();
		},
		swipeDown:function(event,direction,distance,duration) {
			hide_landing();
		}
	})

	$('#landing').on('DOMMouseScroll mousewheel swipedown', function ( event ) {
	  console.log(event);
	  if( event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0 ) { //alternative options for wheelData: wheelDeltaX & wheelDeltaY
	    hide_landing();
	  }
	});

	// Initialize the map
	map = new ol.Map({
	    target: 'worldmap',
	    layers: [
		    new ol.layer.Tile({
		        source: new ol.source.MapQuest({layer: 'osm'})
		    })
	    ],
	    view: new ol.View({
		    center: [6966165.009797823, 3532369.295191832],
		    zoom: 2.8,
		    minZoom: 2,
		    maxZoom: 4
	    })
	});

	// Get coordinate from click -- doesn't really work, gives you center of map
	map.on("click", function(evt) {
	 	console.log(map.getEventCoordinate(evt));
	 });
	
	// Mobile map switcher
	if (isSmall()) {
		$("#mapswitch").html('<img id="mapicon" src="icon/iconmonstr-map-5-icon.svg">');
		// $("#mapicon").fadeToggle(2000,"slow",)
		
		// Fix map view

		map.setView(new ol.View({
		    center: [6966165.009797823, 732369.295191832],
		    zoom: 1.3,
		    minZoom: 1,
		    maxZoom: 3
	    }));

		$("#mapicon").click(function() {
			if (map_showing) {
				$("#storylist").show();
				map_showing = 0;
			} else {
				$("#storylist").hide();
				map_showing = 1;
			}
		})
	}
	if (isMedium()) {
		map.setView(new ol.View({
		    center: [6966165.009797823, 3532369.295191832],
		    zoom: 2
	    }));
	}

	// Compile handlebars templates
	list_template_html = $("#list-template").html();
	list_template = Handlebars.compile(list_template_html);

	// Get sheets data as json
	var masterurl = "https://spreadsheets.google.com/feeds/list/" + sheetID + "/default/public/values?alt=json";
	$.getJSON(masterurl, function(data) {
		data = clean_google_sheet_json(data);
		// console.log(data);

		$("#storylist").html(list_template({stories: data}));

		$.each(data, function(key, obj) {
			// foundation modal manual opening on story click
			$('#modal-' + key + '-a').click(function() {
				open_modal(key);
			});
 
		
			var coord = [Number(obj.lat), Number(obj.lon)];

			iconElement[key] = $('<img class="mapicon" src="icon/place-icon.svg"/>');
			iconElement[key].click(function() {
				open_modal(key);
			});
			
			iconElement[key].hover(
				function() {
					$(this).attr("src","icon/place-icon-color.svg");
				},
				function() {
					$(this).attr("src","icon/place-icon.svg");
				}
			);

			$('#modal-' + key + '-a').hover(
				function() {
					iconElement[key].attr("src","icon/place-icon-color.svg");
				},
				function() {
					iconElement[key].attr("src","icon/place-icon.svg");
				}
			);

			overlays[key] = new ol.Overlay({
			  position: coord,
			  positioning: 'bottom-center',
			  element: iconElement[key]
			});
			
			map.addOverlay(overlays[key]);

			// textElement.click(function(evt) {
			//     console.log('click');
			// });


		});

	
	});

	
	

	$(document).foundation();
});

function isSmall() {
  return matchMedia(Foundation.media_queries.small).matches &&
    !matchMedia(Foundation.media_queries.medium).matches;
}

function isMedium() {
  return matchMedia(Foundation.media_queries.medium).matches &&
    !matchMedia(Foundation.media_queries.large).matches;
}

function hide_landing()
{
	if (onlanding) {
		$("#landing").slideUp();
		onlanding = 0;
	}
}

function open_modal(key)
{
	$('#modal-' + key).foundation('reveal', 'open');
}

function clean_google_sheet_json(data){
	var formatted_json = [];
	var elem = {};
	var real_keyname = '';
	$.each(data.feed.entry, function(i, entry) {
		elem = {};
		$.each(entry, function(key, value){
			// fields that were in the spreadsheet start with gsx$
			if (key.indexOf("gsx$") == 0) 
			{
				// get everything after gsx$
				real_keyname = key.substring(4); 
				elem[real_keyname] = value['$t'];
			}
		});
		formatted_json.push(elem);
	});
	return formatted_json;
}
