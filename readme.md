# nand

Logic gate playground

## Development

```
parcel index.html
```

## TODO

 - ux improvements
	 - stop canvas resizing on spawn
	 - better node sizes / colors
	 - style atoms
	 - better connectin points
	 - place new element
	 - live arrow off of active pin
	 - better right bar look and scroll
 - replace line lib
 - document pins (shortname, longname, description)
 - document chip (label, description)
 - replbace draggable lib

## Controls

 - Click pins to connect them, green pin is `active`
 - `Backspace`/`Delete` will remove connections from `active` chip pin
 - `x` will remove chip with `active` pin
 - `s` will save current workspace as new chip (NOTE: clocks will be converted to inputs)
 - clicking or typing the number of chip in right toolbar will create a new  one in worspace
 - clicking the`x` on chip in toolbar will delete it
 - clicking the `e` on chip in toolbar will load it in to workspace (NOTE: clocks will be converted to inputs)

