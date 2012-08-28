beginfig(1);
draw (100,150) --(200,150) --(200,250) --(100,250) -- cycle;
draw (300,450) --(400,450) --(400,550) --(300,550) -- cycle;
z1 = (150,260);
z2 = (100,400);
z3 = (290,500);
path arc;
arc = z1 .. z2 .. z3;
draw arc;
% labels
label.ulft(btex Actual travel etex,z2);

endfig;

beginfig(2);
draw fullcircle scaled 40;
endfig;

\end;

