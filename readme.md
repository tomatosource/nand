# nand

Logic gate playground

## Development

```
parcel index.html
```

## TODO

- toolbar
- replace source switch and indicators for pins
- custom pin styles
- replace timeout with something smarter
	- on input -> check if any other inputs touch changed source path
	  - if so mark dirty
		- changed || dirty == calc new state
