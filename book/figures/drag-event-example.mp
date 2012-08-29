filenametemplate "%j-%c.mps";
beginfig(1);

%% COLORS
color babyblue;
babyblue := (3/5,4/5,1);
color mandrin;
mandrin := (1,4/5,3/5);
%% END COLORS

%%% BOX ORIGIN
% -- draws straight path between co-ordinates
path originbox;
originbox := (100,150) --(200,150) --(200,250) --(100,250) -- cycle;
draw originbox;
fill originbox withcolor mandrin;
label.ulft("origin (x,y)", (100,250));
%%% END BOX ORIGIN


%%% BOX DESTINATION
path destinationbox;
destinationbox := (300,450) --(400,450) --(400,550) --(300,550) -- cycle;
draw destinationbox;
fill destinationbox withcolor mandrin;
label.ulft("destination (x1,y1)", (300,550));
%%% END BOX DESTINATION

%%% VERTICAL TRAVEL
path verticaltravel;
verticaltravel := drawarrow (150,250) -- (150,500);
draw verticaltravel;
label.rt(btex vertical travel etex,(150,375));
%%% END VERTICAL TRAVEL


%%% HORIZONTAL TRAVEL
path horizontaltravel;
horizontaltravel := drawarrow (150,500) -- (300,500);
draw horizontaltravel;
label.bot(btex horizontal travel etex,(245,500));
%%% END HORIZONTAL TRAVEL

%%% ACTUAL TRAVEL ARC
z1 = (150,250);
z2 = (100,400);
z3 = (300,500);

  %%% TOUCH ACTUAL TRAVEL ARC
  path co;
  co := fullcircle scaled 40 shifted z2;
  draw co;
  fill co withcolor babyblue;
  %%% END TOUCH ACTUAL TRAVEL ARC

path arc;
arc = z1 .. z2 .. z3; % .. draws smooth path between co-ordinates
draw arc;
label.top(btex Actual travel etex,z2);
%%% END ACTUAL TRAVEL ARC

%%% TOUCH ORIGIN
path co;
co := fullcircle scaled 40 shifted (125,210);
draw co;
fill co withcolor babyblue;
label.rt("touch origin (toX,toY)", (125,210));
%%% END TOUCH ORIGIN


%%% TOUCH DESTINATION 
%-- same relative position 
path cd;
cd := fullcircle scaled 40 shifted (325,510);
draw cd;
fill cd withcolor babyblue; 
label.rt("touch destination (tdX,tdY)", (325,510));
%%% END TOUCH DESTINATION




endfig;


\end;

