BOOKDIR=.
book: ${BOOKDIR}/*.tex drag-event-example-1.mps
	cd ${BOOKDIR} && pdflatex -halt-on-error wheel.js.by.example.tex


drag-event-example-1.mps: ${BOOKDIR}/figures/drag-event-example.mp
	cd ${BOOKDIR}/figures && mptopdf drag-event-example.mp

vfd1:
	open ${BOOKDIR}/figures/drag-event-example-1.pdf

all: book figure

clean:
	rm -rf *.pdf *.log
