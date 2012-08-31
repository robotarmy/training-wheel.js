filenametemplate "%j-%c.mps";
beginfig(1);

%% COLORS
color babyblue;
babyblue := (3/5,4/5,1); % r, g, b decimal value between 0..1 
color mandrin;
mandrin := (1,4/5,3/5);
%% END COLORS

%%% CALLOUT STATES
%

path eventbox;

eventbox := (75,100) -- (300,100) -- (300,300) -- (75,300) -- cycle;
draw eventbox;
label.top(btex \tt \uppercase{starting state} etex,(200,100));


eventbox := (250,400) -- (450,400) -- (450,600) -- (250,600) -- cycle;
draw eventbox;
label.top(btex \tt \uppercase{final state} etex,(350,400));

eventbox := (60,350) -- (140,350) -- (140,450) -- (60,450) -- cycle;
draw eventbox;
label.lft(btex \tt \uppercase{dynamic state} etex,(60,400));


%%% END CALLOUT STATES


%%% BOX ORIGIN
% -- draws straight path between co-ordinates
path originbox;
originbox := (150,150) --(250,150) --(250,250) --(150,250) -- cycle;
draw originbox;
fill originbox withcolor mandrin;
label.ulft("origin (x,y)", (150,250));
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
verticaltravel := drawarrow (150,250) -- (150,550);
draw verticaltravel;
label.rt(btex vertical travel etex,(150,375));
%%% END VERTICAL TRAVEL


%%% HORIZONTAL TRAVEL
path horizontaltravel;
horizontaltravel := drawarrow (150,550) -- (300,550);
draw horizontaltravel;
label.bot(btex horizontal travel etex,(200,550));
%%% END HORIZONTAL TRAVEL

%%% ACTUAL TRAVEL ARC
%125,210
%
z0 = (175,210); % touch origin
z1 = (25,210);  % touch arc
z2 = (100,400); % touch actual travel
z3 = (325,510); % touch destination

  %%% TOUCH ORIGIN
  path co;
  co := fullcircle scaled 40 shifted z0;
  draw co;
  fill co withcolor babyblue;
  label.rt("touch origin (toX,toY)", z0);
  %%% END TOUCH ORIGIN

  %%% TOUCH ACTUAL TRAVEL ARC
  path co;
  co := fullcircle scaled 40 shifted z2;
  draw co;
  fill co withcolor babyblue;
  %%% END TOUCH ACTUAL TRAVEL ARC


  %%% TOUCH DESTINATION 
  %-- same relative position 
  path cd;
  cd := fullcircle scaled 40 shifted z3;
  draw cd;
  fill cd withcolor babyblue; 
  label.rt("touch destination (tdX,tdY)", z3);
  %%% END TOUCH DESTINATION
  
path arc;
arc = z0 .. z1 .. z2 .. z3; % .. draws smooth path between co-ordinates
draw arc;
label.top(btex Actual travel etex,z2);
%%% END ACTUAL TRAVEL ARC





endfig;


\end;

