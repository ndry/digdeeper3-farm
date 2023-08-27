The goal is to find the plant that converges the slowest.

The plant is a set of 3 ca237v1, 
treated as the rule, the initial state0 and the initial state1.
The boundary conditions are periodic.

The structure of any plant evolution (maybe: any closed finite discrete system evolution)
is as follows:
Starting from an initial state, the plant eventually evolves to a cycle of states.

We say the plant has converged if any space was reached the second time.

For a given plant, we want to determine the point of the start of the cycle,
and the length of the cycle.

It is easy to detect the cycle automatically if it is short enough,
shorter than the window of detection, which is memory bound.

It is also possible to check the cycle in case of the suspected cycle,
by reevaluating the plant from the very beginning, and comparing each space
to the suspected state, without any window and therefore memory.

We are interested to know the convergence time of the plant,
as we believe it is a good indicator of the plant's complexity.
The most complex plant is the one that converges not to fast, not too slow.
But "not too slow" is relative to full cycle of all possible states,
which is huge (3^81~=4x10^39), and therefore not practical.
Thus, the practical indicator happens to be "does converge, the later the better".

To gamify, we take resources to grow the plant, and yield the crop
only if the plant has converged, the crop is being determined by the convergence time,
and 1x plant of 2x convergence time gives far more crop 
than 2x plants of 1x convergence time.

The player has to visually or otherwise estimate the convergence time,
and decide whether to grow the plant further or not.

The risk is that the plant may not converge given the resources available,
and just exhaust those resources.



If it was a tool, it would

- run the pots at full speed, based on the computer resources
- allow to adjust the computational resources allocated to each pot
- submit the findings and the absence of those to the server



If it was a game, the endgame would:





If it was a game, the start- and midgame would:
