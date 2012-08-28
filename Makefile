tex: *.tex
	xelatex -halt-on-error $<

figure: figures/diag.mp
	cd figures && mptopdf diag.mp
all: tex figure

clean:
	rm -rf *.pdf *.log
