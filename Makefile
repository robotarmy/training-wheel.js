tex: *.tex
	xelatex -halt-on-error $<

all: tex

clean:
	rm -rf *.pdf *.log
