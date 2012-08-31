BOOKDIR=.
book: ${BOOKDIR}/*.tex drag-event-example-1.mps
	cd ${BOOKDIR} && lualatex -halt-on-error wheel.js.by.example.tex


drag-event-example-1.mps: ${BOOKDIR}/figures/drag-event-example.mp
	cd ${BOOKDIR}/figures && mpost drag-event-example.mp

vfd1:
	open ${BOOKDIR}/figures/drag-event-example-1.pdf

all: book figure

clean:
	rm -rf *.pdf *.log
