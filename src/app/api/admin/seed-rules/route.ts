import { NextRequest, NextResponse } from 'next/server';
import { db, tacticalAnalysis } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

const laws = [
  {
    title: 'Law 1: The Field of Play',
    slug: 'law-1-field-of-play',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Defines the dimensions, markings, and features of a football pitch including the goals, penalty area, and corner arcs.',
    explanation: `The football pitch must be rectangular and marked with continuous lines. For international matches, the field must be 100-110 metres long and 64-75 metres wide. Most professional pitches are around 105m x 68m.

The field is divided into two halves by the halfway line, with a centre circle of 9.15 metres radius. The centre mark is at the midpoint of the halfway line — this is where kick-offs are taken.

The penalty area extends 16.5 metres from each goalpost and 16.5 metres into the field. Inside this area, the goalkeeper can handle the ball and fouls by the defending team may result in a penalty kick. The penalty mark is 11 metres from the goal line, directly centred between the posts.

The goal area (sometimes called the "six-yard box") extends 5.5 metres from each goalpost and 5.5 metres into the field. Goal kicks are taken from anywhere inside this area.

Goals are 7.32 metres wide and 2.44 metres high, centred on each goal line. Nets are required in competitive football.

Corner arcs are quarter-circles with a 1-metre radius at each corner of the field. Corner kicks are taken from inside this arc. Corner flagposts must be at least 1.5 metres high and are not optional — they must be present.

The technical area is where the manager and substitutes sit. It extends 1 metre either side of the seating area and up to 1 metre from the touchline.

Artificial pitches are permitted in some competitions but must meet specific FIFA Quality standards. The surface must be green.`,
    keyConcepts: [
      { term: 'Pitch Dimensions', definition: 'Length: 100-110m, Width: 64-75m for international matches. Most pro pitches are 105m x 68m.' },
      { term: 'Penalty Area', definition: 'The 16.5m box where the keeper can handle the ball and defensive fouls may lead to penalties.' },
      { term: 'Goal Area', definition: 'The 5.5m "six-yard box" where goal kicks are taken.' },
      { term: 'Centre Circle', definition: '9.15m radius circle at the midpoint — opponents must stay outside during kick-off.' },
      { term: 'Goal Size', definition: '7.32m wide x 2.44m high (8 yards x 8 feet).' },
      { term: 'Corner Arc', definition: '1-metre radius quarter-circle where corner kicks are taken.' },
    ],
    tags: ['pitch', 'field', 'dimensions', 'markings', 'penalty area', 'goal area'],
  },
  {
    title: 'Law 2: The Ball',
    slug: 'law-2-the-ball',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Specifies the size, weight, pressure, and material requirements for the match ball.',
    explanation: `The ball must be spherical, made of suitable material (usually synthetic leather), and meet strict specifications for competitive football.

A standard match ball (Size 5) must have a circumference of 68-70 cm and weigh 410-450 grams at the start of the match. It must be inflated to a pressure of 0.6-1.1 atmospheres (8.5-15.6 psi) at sea level.

If the ball becomes defective during play, the match is stopped and restarted with a dropped ball at the location where the original ball became defective. If the ball becomes defective during a stoppage (e.g. a free kick, corner kick, penalty kick, throw-in, goal kick, or kick-off), the restart is retaken with a new ball.

Only balls that meet FIFA Quality Pro, FIFA Quality, or IMS (International Match Standard) specifications can be used in official competition matches.

In professional matches, multiple match balls are available around the pitch to speed up play. Ball boys and girls retrieve and supply these balls. The referee decides which ball is used.

Different size balls exist for youth football: Size 3 (for under-8s) and Size 4 (for under-14s). But at senior professional level, Size 5 is always used.`,
    keyConcepts: [
      { term: 'Size 5', definition: 'The standard match ball: 68-70cm circumference, 410-450g weight.' },
      { term: 'Pressure', definition: '0.6-1.1 atmospheres (8.5-15.6 psi) at sea level.' },
      { term: 'Defective Ball', definition: 'If the ball bursts during play, the match is stopped and restarted with a dropped ball.' },
      { term: 'FIFA Quality', definition: 'Match balls must carry the FIFA Quality Pro, FIFA Quality, or IMS mark.' },
    ],
    tags: ['ball', 'equipment', 'size 5', 'specifications'],
  },
  {
    title: 'Law 3: The Players',
    slug: 'law-3-the-players',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'A match is played by two teams of 11 players each, with a minimum of 7. Most competitions now allow 5 substitutions.',
    explanation: `Each team fields a maximum of 11 players, one of whom must be the goalkeeper. A match cannot start or continue if either team has fewer than 7 players.

Substitutions: In most professional competitions (Premier League, Champions League, World Cup, etc.), teams are allowed 5 substitutions per match, using a maximum of 3 substitution windows (plus half-time). This rule was introduced during the COVID-19 pandemic and made permanent by IFAB.

A substituted player cannot return to the match — once you come off, you're off for good. The substitute only becomes a player when they enter the field and the player they replace leaves. Substitutions must occur at the halfway line during a stoppage in play.

If a team starts with 11 players but red cards reduce them below 7, the match is abandoned. However, if a team starts with fewer than 11 players (due to late arrivals), those players can join later as substitutes.

Named substitutes who are not used remain on the bench for the entire match. In most competitions, teams can name 7-12 substitutes on the bench depending on the competition rules.

If a player is sent off before kick-off, they can be replaced by a named substitute, but the team's total number of permitted substitutions is not increased.

In friendly matches, more substitutions are usually allowed, sometimes unlimited. Youth and amateur competitions often have their own substitution rules.`,
    keyConcepts: [
      { term: '11 Players', definition: 'Each team has a maximum of 11 on the pitch, one of whom must be the goalkeeper.' },
      { term: 'Minimum 7', definition: 'A match cannot start or continue if either team has fewer than 7 players.' },
      { term: '5 Substitutions', definition: 'Most competitions allow 5 subs per match in up to 3 windows (plus half-time).' },
      { term: 'No Return', definition: 'A substituted player cannot come back on the pitch in the same match.' },
      { term: 'Red Card Before Kick-off', definition: 'A player sent off before kick-off can be replaced by a named substitute.' },
    ],
    tags: ['players', 'substitutions', 'squad', 'team', 'goalkeeper'],
  },
  {
    title: "Law 4: The Players' Equipment",
    slug: 'law-4-players-equipment',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Players must wear a jersey, shorts, socks, shinguards, and footwear. Jewellery is banned, and goalkeepers must be distinguishable.',
    explanation: `Players must wear: a jersey/shirt (with sleeves), shorts, socks, shinguards, and footwear (boots or trainers). The shinguards must be covered entirely by the socks and made of a suitable material to provide reasonable protection.

Jewellery is strictly prohibited. This includes rings, bracelets, necklaces, and earrings. Taping over jewellery is NOT permitted — it must be removed. This rule exists for player safety.

The goalkeeper must wear colours that distinguish them from all other players, the referee, and assistant referees. In practice, goalkeepers wear completely different coloured kits.

If two teams have similar coloured kits, the away team (or the team listed second) must change. Each team must bring an alternative kit.

Undershirts must be the same colour as the main shirt sleeve. Undergarment shorts/tights must be the same colour as the shorts.

Boots with dangerous studs (e.g. sharpened metal studs) are not allowed. The referee inspects studs if there is any concern.

Players cannot wear any electronic or communication equipment unless it is performance-tracking technology approved by the match organiser. Referees may wear communication earpieces.

If a player loses a boot or shinguard accidentally during play, they should replace it as soon as possible. They may continue playing until the next stoppage if the equipment is lost during active play.`,
    keyConcepts: [
      { term: 'Compulsory Equipment', definition: 'Jersey, shorts, socks, shinguards (under socks), and footwear.' },
      { term: 'No Jewellery', definition: 'All jewellery must be removed — taping over it is not permitted.' },
      { term: 'Goalkeeper Kit', definition: 'Must be distinguishable from all other players and match officials.' },
      { term: 'Undershirts', definition: 'Must match the colour of the main shirt sleeve.' },
      { term: 'Shinguards', definition: 'Must be made of suitable material and entirely covered by the socks.' },
    ],
    tags: ['equipment', 'kit', 'boots', 'shinguards', 'jewellery', 'goalkeeper'],
  },
  {
    title: 'Law 5: The Referee',
    slug: 'law-5-the-referee',
    category: 'laws',
    difficulty: 'intermediate',
    summary: 'The referee has full authority to enforce the Laws of the Game. Their decisions are final, though VAR can recommend reviews.',
    explanation: `The referee is the ultimate authority on the field. Every decision made by the referee is final — including decisions made with the assistance of VAR. A referee can change a decision only before play has restarted or the match has ended.

The referee's key duties include: enforcing the Laws of the Game, controlling the match, acting as timekeeper, stopping play for injuries, allowing play to continue when the team that was fouled would benefit (the advantage rule), and taking disciplinary action.

The Advantage Rule: If a team is fouled but still has a promising attack, the referee can wave play on. If the expected advantage does not materialise within a few seconds, the referee brings play back for the original foul. The referee signals advantage by extending both arms forward.

The referee carries a whistle, a watch (usually two), yellow and red cards, a notebook, and coin for the toss. In professional matches, referees also wear communication earpieces connected to the assistant referees and VAR.

The referee should only stop play for an injury if the player appears seriously injured. For minor injuries, the referee waits until the ball goes out of play. An injured player must leave the field and can only return with the referee's permission after play has restarted.

If the referee makes an error, they cannot change the decision once play has restarted. However, the referee can consult the assistant referees or VAR before restarting play.

VAR (Video Assistant Referee): The referee can review decisions on the pitchside monitor or accept the VAR's recommendation. VAR is covered in more detail under the VAR Protocol section.`,
    keyConcepts: [
      { term: 'Final Authority', definition: 'The referee has the ultimate decision-making power on the field.' },
      { term: 'Advantage Rule', definition: 'Play continues if the fouled team benefits; if not, play returns to the original foul.' },
      { term: 'Decision Changes', definition: 'A decision can only be changed before play restarts or the match ends.' },
      { term: 'Injury Protocol', definition: 'Play is only stopped for serious injuries. Minor injuries wait until the ball is out of play.' },
      { term: 'VAR Consultation', definition: 'The referee can review pitchside or accept the VAR recommendation.' },
    ],
    tags: ['referee', 'authority', 'advantage', 'VAR', 'decisions', 'whistle'],
  },
  {
    title: 'Law 6: The Other Match Officials',
    slug: 'law-6-other-match-officials',
    category: 'laws',
    difficulty: 'intermediate',
    summary: 'Covers assistant referees (linesmen), the fourth official, VAR, and the AVAR and their roles during a match.',
    explanation: `In addition to the referee, professional matches have a team of officials:

Assistant Referees (ARs): Two assistant referees (often called "linesmen") patrol the touchlines. They signal for offside, throw-ins, goal kicks, and corner kicks by raising their flag. They also alert the referee to fouls and incidents near their position. The assistant referee on the attacking side is responsible for offside decisions.

Fourth Official: Positioned between the two team benches, the fourth official manages substitutions, checks equipment, signals added time (holding up the electronic board), and monitors the technical area. They also replace the referee or an assistant referee if they cannot continue.

Video Assistant Referee (VAR): Stationed in a video operation room, the VAR reviews decisions relating to: goals, penalty kicks, direct red cards, and mistaken identity. The VAR communicates with the referee via earpiece and can recommend the referee review the pitchside monitor.

Assistant VAR (AVAR): Works alongside the VAR, typically monitoring the live match broadcast while the VAR reviews replays. The AVAR ensures nothing is missed.

Goal Line Technology (GLT): Automated system that determines whether the ball has crossed the goal line. The result is communicated instantly to the referee's watch. The referee cannot overrule GLT.

In some competitions, additional assistant referees (AAR) are positioned behind each goal line, though this has largely been replaced by VAR.`,
    keyConcepts: [
      { term: 'Assistant Referees', definition: 'Two officials on the touchlines who flag for offside, throw-ins, goal kicks, and corners.' },
      { term: 'Fourth Official', definition: 'Manages subs, signals added time, monitors the technical area, and can replace injured officials.' },
      { term: 'VAR', definition: 'Reviews goals, penalties, direct red cards, and mistaken identity via video replay.' },
      { term: 'AVAR', definition: 'Assists the VAR by monitoring the live broadcast feed.' },
      { term: 'Goal Line Technology', definition: 'Instantly determines if the ball has crossed the goal line — the referee cannot overrule it.' },
    ],
    tags: ['officials', 'assistant referee', 'linesman', 'fourth official', 'VAR', 'goal line technology'],
  },
  {
    title: 'Law 7: The Duration of the Match',
    slug: 'law-7-duration-of-match',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'A match consists of two 45-minute halves with added time. Extra time and penalty shootouts apply in knockout matches.',
    explanation: `A standard football match lasts 90 minutes: two halves of 45 minutes each, with a half-time interval of no more than 15 minutes.

Added Time (Stoppage Time): The referee adds time at the end of each half to compensate for: substitutions, assessment and/or removal of injured players, time-wasting, disciplinary action (yellow/red cards), VAR reviews, goal celebrations, drinks breaks, and any other cause of lost playing time.

The amount of added time is at the referee's discretion, though the fourth official signals the minimum number of added time minutes. The actual time played can exceed this minimum. In recent years, referees have been instructed to be more generous with added time to account for time-wasting — it's not unusual to see 8-12 minutes added, especially in the second half.

Extra Time: In knockout competitions where a winner must be decided, if the score is level after 90 minutes, two periods of 15 minutes each are played (with a short break between them but no half-time break). Added time is also applied to extra time periods.

Penalty Shootout: If the score is still level after extra time, a penalty shootout determines the winner. Each team takes 5 penalties (taken alternately). If still level after 5 each, it continues as sudden death — one penalty each until one team scores and the other misses.

Cooling/Drinks Breaks: In hot weather, the referee may authorise 1-minute drinks breaks (at roughly the 30th minute) or 3-minute cooling breaks. These do not count as stoppages — added time compensates for them.

Abandoned Matches: If a match is abandoned (e.g. floodlight failure, crowd trouble, unsafe conditions), the competition rules determine whether it is replayed or the result stands.`,
    keyConcepts: [
      { term: '90 Minutes', definition: 'Two halves of 45 minutes each, with a half-time break of up to 15 minutes.' },
      { term: 'Added Time', definition: 'Extra minutes at the end of each half to compensate for stoppages like subs, injuries, VAR, and time-wasting.' },
      { term: 'Extra Time', definition: 'Two 15-minute periods played in knockout matches if the score is level after 90 minutes.' },
      { term: 'Penalty Shootout', definition: 'Five penalties each (alternating), then sudden death if still level.' },
      { term: 'Drinks/Cooling Breaks', definition: 'Authorised in hot conditions — compensated with added time.' },
    ],
    tags: ['time', 'duration', 'added time', 'stoppage time', 'extra time', 'penalty shootout'],
  },
  {
    title: 'Law 8: The Start and Restart of Play',
    slug: 'law-8-start-restart-play',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Play begins with a kick-off. Other restarts include dropped balls after certain stoppages.',
    explanation: `Kick-off starts each half and restarts play after a goal. A coin toss determines which team kicks off — the winning team chooses which goal to attack in the first half (they do NOT choose to kick off). The other team takes the kick-off.

For the kick-off: the ball is placed on the centre mark, all players must be in their own half, opponents must be outside the centre circle (9.15m from the ball), and the ball is in play when it is kicked and clearly moves. A goal CAN be scored directly from a kick-off.

After a goal is scored, the team that conceded kicks off. At the start of the second half, the teams swap ends and the team that did NOT kick off the first half now kicks off.

Dropped Ball: Used when the referee stops play for any reason not covered by the Laws (e.g. a serious injury, the ball hitting the referee and creating an advantage, an outside agent entering the field, or a defective ball). The dropped ball is given to the goalkeeper of the team that last touched the ball, unless play was stopped in the penalty area, in which case it goes to the defending goalkeeper. All other players must be at least 4 metres away.

Previously, a dropped ball was contested — two players would compete for it. This was changed in 2019 to give it directly to one team to reduce controversy and gamesmanship.`,
    keyConcepts: [
      { term: 'Kick-off', definition: 'Ball placed on centre mark; opponents outside centre circle. A goal can be scored directly.' },
      { term: 'Coin Toss', definition: 'The winner chooses which end to attack (not who kicks off).' },
      { term: 'Dropped Ball', definition: 'Given to the team that last touched the ball (or the defending goalkeeper if in the penalty area).' },
      { term: '4-Metre Rule', definition: 'All other players must be at least 4m away from a dropped ball.' },
    ],
    tags: ['kick-off', 'restart', 'dropped ball', 'coin toss'],
  },
  {
    title: 'Law 9: The Ball In and Out of Play',
    slug: 'law-9-ball-in-out-of-play',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'The ball is out of play only when it has wholly crossed the goal line or touchline, or when the referee stops play.',
    explanation: `This is one of the simplest but most important laws. The ball is out of play when:

1. It has wholly passed over the goal line or touchline, whether on the ground or in the air. "Wholly" means the entire ball must cross the entire line — if even a tiny fraction of the ball is still on the line, it is still in play.

2. Play has been stopped by the referee (whistle blown).

The ball is in play at all other times, including:
- When it rebounds off a goalpost, crossbar, or corner flag and stays on the field
- When it rebounds off the referee or an assistant referee who is on the field of play
- When it touches the ground inside the field after bouncing or deflecting

The lines belong to the area they enclose — so the touchline is part of the field of play, and the goal line is part of the field of play.

Goal Line Technology (GLT): In professional matches, GLT provides an instant, automated determination of whether the ball has wholly crossed the goal line. The referee's watch buzzes and displays "GOAL" if it has. This technology is accurate to within a few millimetres.

A goal is scored when the whole ball passes over the goal line between the goalposts and under the crossbar, provided no offence has been committed by the scoring team.`,
    keyConcepts: [
      { term: 'Wholly Crossed', definition: 'The ENTIRE ball must cross the ENTIRE line — any overlap means it is still in play.' },
      { term: 'Rebounds', definition: 'Ball remains in play if it hits the goalpost, crossbar, corner flag, or referee and stays on the field.' },
      { term: 'Lines Belong to the Area', definition: 'The touchline and goal line are part of the field of play, not outside it.' },
      { term: 'Goal Line Technology', definition: 'Automated system accurate to within millimetres that confirms whether a goal has been scored.' },
    ],
    tags: ['in play', 'out of play', 'goal line', 'touchline', 'goal line technology'],
  },
  {
    title: 'Law 10: Determining the Outcome of a Match',
    slug: 'law-10-determining-outcome',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'The team scoring more goals wins. Draws are possible in league matches; knockout ties use extra time and penalties.',
    explanation: `A goal is scored when the whole of the ball passes over the goal line, between the goalposts and under the crossbar, provided no offence has been committed. The team that scores more goals wins.

In league competitions, if teams score the same number of goals, the match is a draw. Teams typically receive 3 points for a win, 1 for a draw, and 0 for a loss.

In knockout competitions (where a winner must be determined):
1. If the match ends level, extra time is played (two 15-minute periods)
2. If still level after extra time, a penalty shootout decides the winner

The Away Goals Rule: This rule, which gave extra weight to goals scored away from home in two-legged ties, was abolished by UEFA in 2021. Most other competitions have followed suit. Now, if the aggregate score is level after two legs, extra time and then penalties are used.

Penalty Shootout Procedure:
- The referee chooses the goal (usually based on safety/pitch condition or coin toss)
- Each team selects 5 kickers from players on the pitch at the end of extra time
- Teams take penalties alternately
- If one team has an unassailable lead (e.g. 3-0 after 3 penalties each), the remaining kicks are not taken
- If level after 5 each: sudden death — one kick each until one team scores and the other doesn't
- All eligible players (including the goalkeeper) must take a penalty before any player takes a second

ABBA Penalty Format: IFAB trialled an "ABBA" format (Team A, Team B, Team B, Team A) to reduce the advantage of going first, but this was not widely adopted. The traditional alternating format remains standard.`,
    keyConcepts: [
      { term: 'Goal', definition: 'Scored when the whole ball crosses the goal line between the posts and under the bar.' },
      { term: 'Points System', definition: '3 points for a win, 1 for a draw, 0 for a defeat in league football.' },
      { term: 'Away Goals Rule (Abolished)', definition: 'No longer used — extra time and penalties decide tied knockout matches.' },
      { term: 'Penalty Shootout', definition: '5 kicks each, then sudden death. All players must take before anyone goes twice.' },
    ],
    tags: ['goals', 'result', 'penalty shootout', 'extra time', 'away goals', 'points'],
  },
  {
    title: 'Law 11: Offside',
    slug: 'law-11-offside',
    category: 'laws',
    difficulty: 'advanced',
    summary: 'The most debated law in football. A player is offside if they are nearer to the opponent\'s goal line than both the ball and the second-last defender when the ball is played to them.',
    explanation: `Offside is the most discussed and debated law in football. Here is how it actually works:

A player is in an offside POSITION when they are:
- In the opponents' half of the field, AND
- Nearer to the opponents' goal line than both the ball AND the second-last defender (the last defender is usually the goalkeeper)

Being in an offside position is NOT an offence by itself. It only becomes an offence when a teammate plays the ball and the player in the offside position becomes actively involved by:

1. Interfering with play — touching or playing the ball passed or touched by a teammate
2. Interfering with an opponent — preventing an opponent from playing the ball by obstructing their line of vision or movement, or challenging them for the ball
3. Gaining an advantage — playing the ball that rebounds off a goalpost, crossbar, or opponent, having been in an offside position

You CANNOT be offside from:
- A goal kick
- A throw-in
- A corner kick

The offside position is judged at the moment the ball is played by the teammate, NOT when the player receives it. This is critical — a player can be onside when the ball is passed and then run into an offside position to receive it, and that is perfectly legal.

The "second-last defender" typically means the last outfield player, because the goalkeeper is usually the last defender. But if the goalkeeper has come upfield, the second-last defender could be an outfield player.

Deliberate Play vs Deflection: If a defender deliberately plays the ball (not just a deflection or save), the offside is "reset" and the attacker is no longer offside. However, if the ball simply deflects off a defender (an uncontrolled touch), the attacker remains offside.

Semi-Automated Offside Technology (SAOT): Used in the Premier League, Champions League, and World Cup. Limb-tracking cameras and AI determine the exact moment the ball is played and whether any body part that can legally score a goal (everything except hands and arms) is offside. A 3D animation is shown on the stadium screen and broadcast.`,
    keyConcepts: [
      { term: 'Offside Position', definition: 'In the opponents\' half, nearer to the goal line than both the ball and the second-last defender.' },
      { term: 'Active Involvement', definition: 'Offside is only penalised if the player interferes with play, an opponent, or gains an advantage.' },
      { term: 'Moment of the Pass', definition: 'Offside is judged when the ball is played, NOT when it is received.' },
      { term: 'Exceptions', definition: 'You cannot be offside from a goal kick, throw-in, or corner kick.' },
      { term: 'Deliberate Play vs Deflection', definition: 'A deliberate play by a defender resets offside; a mere deflection does not.' },
      { term: 'SAOT', definition: 'Semi-Automated Offside Technology uses AI and cameras for precise offside decisions.' },
    ],
    tags: ['offside', 'offside rule', 'SAOT', 'linesman', 'flag', 'second-last defender'],
  },
  {
    title: 'Law 12: Fouls and Misconduct',
    slug: 'law-12-fouls-and-misconduct',
    category: 'laws',
    difficulty: 'intermediate',
    summary: 'Covers all fouls (direct and indirect free kicks), yellow cards, red cards, handball, DOGSO, and serious foul play.',
    explanation: `This is the longest and most complex law. It covers everything from minor fouls to red card offences.

DIRECT FREE KICK offences (a goal can be scored directly): awarded when a player commits any of the following carelessly, recklessly, or using excessive force: kicks, trips, charges, strikes, pushes, or tackles an opponent; holds an opponent; handles the ball deliberately (except goalkeeper in own penalty area); impedes an opponent with contact.

INDIRECT FREE KICK offences (cannot score directly — must touch another player first): goalkeeper holds the ball for more than 6 seconds; goalkeeper picks up a deliberate back-pass from a teammate's foot; goalkeeper handles a throw-in from a teammate; plays in a dangerous manner (e.g. high foot near opponent's head); impedes an opponent without contact.

YELLOW CARD (caution) offences: delaying restart, dissent, entering/leaving field without permission, failing to respect distance at restarts, persistent offences, unsporting behaviour (diving, shirt removal when celebrating, excessive celebration).

RED CARD (sending off) offences: serious foul play (dangerous tackle with excessive force), violent conduct, spitting, denying a goal or obvious goal-scoring opportunity by handball (DOGSO), denying a goal-scoring opportunity to a player moving towards goal by a foul (DOGSO), using offensive language/gestures, receiving a second yellow card.

DOGSO (Denying an Obvious Goal-Scoring Opportunity): If a defender commits a foul that stops a clear goal-scoring opportunity, it is a red card — UNLESS the foul occurs inside the penalty area and the referee awards a penalty, in which case it is only a yellow card (the "double jeopardy" rule, introduced in 2016). Exception: if the foul is a non-deliberate handball or a genuine attempt to play the ball in the penalty area, it's a yellow. If it is a foul that does not attempt to play the ball (pulling, holding, pushing), it remains a red card even with a penalty.

HANDBALL: A player commits handball if they: deliberately touch the ball with hand/arm; score directly with hand/arm (even if accidental); create a goal-scoring opportunity by touching with hand/arm; touch the ball when hand/arm is in an unnaturally wide position making the body larger. The boundary of the arm is the bottom of the armpit. A goalkeeper handling the ball outside their penalty area is treated the same as any other player.`,
    keyConcepts: [
      { term: 'Direct Free Kick', definition: 'Awarded for physical fouls (kicks, trips, pushes, holds, handball). A goal can be scored directly.' },
      { term: 'Indirect Free Kick', definition: 'For non-contact offences (dangerous play, goalkeeper violations). Must touch another player before entering the goal.' },
      { term: 'Yellow Card', definition: 'Caution for diving, time-wasting, dissent, persistent fouling, shirt removal, etc.' },
      { term: 'Red Card', definition: 'Sending off for violent conduct, serious foul play, DOGSO, offensive language, or second yellow.' },
      { term: 'DOGSO', definition: 'Denying an Obvious Goal-Scoring Opportunity — normally a red card, but only yellow if a penalty is awarded inside the box (double jeopardy rule).' },
      { term: 'Handball', definition: 'Deliberate handling, scoring with hand/arm, or hand in "unnatural position" making body bigger.' },
    ],
    tags: ['fouls', 'yellow card', 'red card', 'handball', 'DOGSO', 'misconduct', 'free kick'],
  },
  {
    title: 'Law 13: Free Kicks',
    slug: 'law-13-free-kicks',
    category: 'laws',
    difficulty: 'intermediate',
    summary: 'Free kicks are either direct (can score) or indirect (must touch another player). Opponents must be 9.15m away.',
    explanation: `Free kicks are awarded for fouls and misconduct. There are two types:

DIRECT FREE KICK: The ball can go directly into the goal without touching another player. If a direct free kick goes into the kicker's own goal, a corner kick is awarded (not an own goal from a free kick).

INDIRECT FREE KICK: The ball must touch another player (either team) before entering the goal. The referee signals an indirect free kick by raising their arm above their head. If an indirect free kick goes directly into the goal without touching another player, a goal kick is awarded.

The Wall and Distance: All opponents must be at least 9.15 metres (10 yards) from the ball when a free kick is taken. If the free kick is within 9.15m of the goal, defending players may stand on the goal line between the goalposts.

Defensive Wall Rule (introduced 2019): When the attacking team forms a "wall" of 3 or more players, the attacking team's players must be at least 1 metre away from the wall. This prevents attackers from standing in the wall to disrupt it.

Quick Free Kicks: The kicker can take the free kick quickly without waiting for the referee's whistle, UNLESS the referee has indicated the kick must wait (e.g. to show a card, position the wall, or wait for VAR). If a quick free kick is taken, opponents do not need to be 9.15m away — the kicker takes the risk.

The ball must be stationary when kicked, and the kicker cannot touch the ball again until another player has touched it.

Free kicks for offences inside the penalty area by the defending team result in a penalty kick (direct free kick) or an indirect free kick from the spot of the offence.

Encroachment: If an opponent is closer than 9.15m and intercepts the ball, the free kick is retaken. If a teammate is too close to the wall, an indirect free kick is awarded to the opposing team.`,
    keyConcepts: [
      { term: 'Direct Free Kick', definition: 'Can score directly. Awarded for physical fouls.' },
      { term: 'Indirect Free Kick', definition: 'Must touch another player first. Referee raises arm to signal.' },
      { term: '9.15m (10 yards)', definition: 'Minimum distance opponents must be from the ball at a free kick.' },
      { term: 'Defensive Wall Rule', definition: 'Attacking players must stand at least 1m from a wall of 3+ defenders.' },
      { term: 'Quick Free Kick', definition: 'Can be taken without the whistle unless the referee has indicated otherwise.' },
    ],
    tags: ['free kick', 'wall', 'direct', 'indirect', '10 yards', 'quick free kick'],
  },
  {
    title: 'Law 14: The Penalty Kick',
    slug: 'law-14-penalty-kick',
    category: 'laws',
    difficulty: 'intermediate',
    summary: 'Awarded for direct free kick offences inside the penalty area. Taken from the penalty mark (11m) with specific procedures.',
    explanation: `A penalty kick is awarded when a player commits a direct free kick offence inside their own penalty area while the ball is in play. The ball must be in play and the offence inside the penalty area — it doesn't matter where the ball is, it's where the offence occurs.

Procedure:
- The ball is placed on the penalty mark (11 metres from the goal line)
- The goalkeeper must stay on the goal line, facing the kicker, between the posts, until the ball is kicked. They can move laterally along the line but must not come forward
- All other players must be: outside the penalty area, behind the penalty mark, and at least 9.15m from the penalty mark (this is why there's an arc at the top of the penalty area — "the D")
- The kicker must kick the ball forward. They cannot play it backwards to a teammate
- The kicker cannot touch the ball again until another player has touched it

Retakes: The kick is retaken if:
- The goalkeeper moves off the line and the penalty is saved or missed (goalkeeper cautioned on second offence)
- A teammate of the kicker encroaches and the penalty is scored (the goal is disallowed)
- A defender encroaches and the penalty is missed (retake)
- Both teams encroach (always retaken)

If the penalty is scored despite encroachment by a defender, the goal stands. If the penalty is missed despite encroachment by the kicker's teammate, the free kick goes to the defending team.

The goalkeeper must have at least part of one foot touching (or in line with) the goal line when the penalty is kicked. VAR often checks this and has caused several retakes.

Feinting during the run-up is permitted, but feinting once the kicker has completed the run-up (e.g. stopping and then kicking) is an offence — the kicker receives a yellow card and the penalty is retaken if scored, or an indirect free kick if missed.`,
    keyConcepts: [
      { term: 'Penalty Mark', definition: '11 metres from the goal line, centred between the goalposts.' },
      { term: 'Goalkeeper', definition: 'Must stay on the goal line until the ball is kicked. Can move laterally but not forward.' },
      { term: 'The D', definition: 'The arc at the top of the penalty area marking 9.15m from the penalty spot.' },
      { term: 'Encroachment', definition: 'If a defender encroaches and the penalty misses, it is retaken. If the kicker\'s teammate encroaches and it scores, the goal is disallowed.' },
      { term: 'Feinting', definition: 'Allowed during the run-up but not after it is completed — stopping to re-kick earns a yellow card.' },
    ],
    tags: ['penalty', 'penalty kick', 'goalkeeper', 'encroachment', 'retake', 'the D'],
  },
  {
    title: 'Law 15: The Throw-In',
    slug: 'law-15-throw-in',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Awarded when the ball wholly crosses the touchline. The thrower must use both hands from behind the head with both feet on the ground.',
    explanation: `A throw-in is awarded when the whole ball passes over the touchline (on the ground or in the air). It is given to the team that did NOT last touch the ball.

The thrower must:
- Face the field of play
- Have part of each foot on the touchline or on the ground outside the touchline
- Use both hands to deliver the ball from behind and over the head
- Throw from the point where it left the field (or close to it)

A foul throw (lifting a foot, throwing from the side, not using both hands) results in the throw-in being given to the opposing team.

You CANNOT score a goal directly from a throw-in. If the ball enters the opponent's goal directly, a goal kick is awarded. If it enters the thrower's own goal, a corner kick is awarded.

Opponents must stand at least 2 metres from the point where the throw-in is taken. If an opponent unfairly distracts or impedes the thrower, they receive a yellow card.

The thrower cannot touch the ball again until another player has touched it. If the thrower touches the ball again before another player, an indirect free kick is awarded to the opposing team.

Long throws: Some teams use specialist long throw-in takers who can launch the ball into the penalty area. This is perfectly legal and has become a legitimate attacking tactic. There are no distance restrictions on how far a throw-in can travel.

Rory Delap, Dave Challinor, and more recently Aron Gunnarsson and Stoke City made the long throw famous. Some clubs specifically recruit players with this ability.`,
    keyConcepts: [
      { term: 'Both Hands', definition: 'The ball must be thrown with both hands from behind and over the head.' },
      { term: 'Both Feet', definition: 'Part of each foot must be on the touchline or on the ground outside it.' },
      { term: 'No Direct Goal', definition: 'A goal cannot be scored directly from a throw-in.' },
      { term: 'Foul Throw', definition: 'Lifting a foot, one-handed throw, or throwing from the wrong spot gives the throw to the other team.' },
      { term: '2-Metre Distance', definition: 'Opponents must stand at least 2m from the throw-in point.' },
    ],
    tags: ['throw-in', 'touchline', 'foul throw', 'long throw'],
  },
  {
    title: 'Law 16: The Goal Kick',
    slug: 'law-16-goal-kick',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Awarded when the attacking team last touches the ball before it crosses the goal line (outside the goal). Taken from the goal area.',
    explanation: `A goal kick is awarded when the whole ball passes over the goal line (not into the goal) and was last touched by the attacking team.

The ball is placed anywhere inside the goal area (the "six-yard box") and must be kicked by a player of the defending team. The goalkeeper usually takes goal kicks, but any player can take them.

Since 2019, the ball is in play as soon as it is kicked — it no longer needs to leave the penalty area first. This allows short goal kicks where the goalkeeper passes to a nearby defender inside the penalty area.

Opponents must be outside the penalty area when the goal kick is taken. If an opponent is inside the penalty area when the goal kick is taken and they touch the ball or challenge for it, the goal kick is retaken.

A goal CANNOT be scored directly against the opponents from a goal kick (though this would be an extraordinary long-range kick). If the ball enters the opponent's goal directly from a goal kick, a goal kick is awarded to the other team.

A player CANNOT be offside from a goal kick. This is one of the three exceptions to the offside rule (along with throw-ins and corner kicks).

The kicker cannot touch the ball again until another player has touched it. If they do, an indirect free kick is awarded.

Modern football has transformed the goal kick into a tactical tool. Teams that play out from the back (like Manchester City under Pep Guardiola) use short goal kicks as the starting point of their build-up play. Other teams prefer to go long, bypassing the opposition's press.`,
    keyConcepts: [
      { term: 'Goal Area', definition: 'The ball can be placed anywhere in the six-yard box for a goal kick.' },
      { term: 'In Play Immediately', definition: 'Since 2019, the ball is live as soon as it is kicked — no need to leave the penalty area.' },
      { term: 'Opponents Outside', definition: 'Opposing players must be outside the penalty area until the ball is kicked.' },
      { term: 'No Offside', definition: 'You cannot be offside from a goal kick.' },
      { term: 'Any Player', definition: 'Any defender can take the goal kick, not just the goalkeeper.' },
    ],
    tags: ['goal kick', 'goal area', 'six-yard box', 'build-up play'],
  },
  {
    title: 'Law 17: The Corner Kick',
    slug: 'law-17-corner-kick',
    category: 'laws',
    difficulty: 'beginner',
    summary: 'Awarded when the defending team last touches the ball before it crosses the goal line. Taken from the corner arc nearest to where it went out.',
    explanation: `A corner kick is awarded when the whole ball passes over the goal line (not into the goal) and was last touched by the defending team.

The ball is placed inside the corner arc nearest to where it crossed the goal line. The corner flagpost must not be moved — it stays in place during the kick.

Procedure:
- The ball must be placed inside the corner arc (on or inside the quarter-circle line)
- The corner flagpost cannot be moved
- Opponents must be at least 9.15 metres (10 yards) from the corner arc
- The ball is in play when it is kicked and clearly moves
- The kicker cannot touch the ball a second time until another player has touched it

A goal CAN be scored directly from a corner kick, but only against the opposing team. If the ball goes directly into the kicker's own goal (which would be extraordinary), a corner kick is awarded to the opposing team.

A player CANNOT be offside directly from a corner kick. This is one of three exceptions to the offside rule.

Inswinging vs Outswinging Corners: Right-footed players taking corners from the left side typically produce inswinging corners (curving toward goal), while corners from the right side swing away from goal (outswinging). Teams often have designated left-footed and right-footed corner takers.

Short Corners: Instead of crossing the ball into the box, the kicker plays a short pass to a nearby teammate. This is legal as long as the ball moves from the corner arc. It can be tactically useful to draw defenders out of position.

Near-Post and Far-Post Deliveries: Coaches train specific corner routines — near-post flick-ons, far-post headers, short corners, and variations to create goal-scoring opportunities. Set pieces account for roughly 30% of goals in professional football.`,
    keyConcepts: [
      { term: 'Corner Arc', definition: 'The quarter-circle at the corner of the field where the ball is placed.' },
      { term: '9.15m Distance', definition: 'Opponents must be at least 10 yards from the corner arc.' },
      { term: 'Direct Goal', definition: 'A goal CAN be scored directly from a corner kick.' },
      { term: 'No Offside', definition: 'You cannot be offside directly from a corner kick.' },
      { term: 'Short Corner', definition: 'A short pass to a teammate instead of a cross — a legitimate tactical option.' },
    ],
    tags: ['corner kick', 'corner arc', 'set piece', 'inswinger', 'outswinger'],
  },
  {
    title: 'VAR Protocol: Video Assistant Referee',
    slug: 'var-protocol',
    category: 'var',
    difficulty: 'intermediate',
    summary: 'VAR reviews four categories: goals, penalty decisions, direct red cards, and mistaken identity. The on-field referee makes the final decision.',
    explanation: `Video Assistant Referee (VAR) was introduced to help referees correct "clear and obvious errors" and "serious missed incidents" in four match-changing situations:

1. GOALS: Was there an offside, foul, handball, or other offence in the build-up? VAR checks every goal scored, reviewing the entire attacking phase.

2. PENALTY DECISIONS: Should a penalty have been awarded or was a penalty incorrectly given? VAR reviews potential fouls, handballs, and whether the incident occurred inside or outside the penalty area.

3. DIRECT RED CARD INCIDENTS: Was the challenge serious foul play? Was there violent conduct? VAR does NOT review yellow card decisions or second yellows.

4. MISTAKEN IDENTITY: If the referee cautions or sends off the wrong player, VAR corrects this.

The VAR Process:
- The VAR reviews the incident in the video operation room
- The VAR communicates with the referee via earpiece
- The VAR can recommend an "on-field review" (OFR) — the referee watches replays on the pitchside monitor
- OR the VAR can provide factual information (e.g. offside position confirmed by technology)
- The on-field referee ALWAYS makes the final decision

"Clear and Obvious Error": VAR should only intervene if the original decision was clearly wrong. Subjective 50/50 calls should generally stand. This is the most controversial aspect — fans and pundits debate what qualifies as "clear and obvious."

The referee signals a VAR review by drawing a rectangle in the air with their fingers (the "TV screen" gesture). After reviewing, the referee signals the final decision.

VAR was first used at the 2018 FIFA World Cup and has since been adopted in the Premier League (2019), Champions League, La Liga, Serie A, Bundesliga, and most major leagues worldwide.

Semi-Automated Offside Technology (SAOT): Works alongside VAR, using 12+ cameras to track 29 body points on each player at 50 frames per second. It generates a 3D animation showing exactly which body part was offside, providing a visual explanation for fans.

Criticism and Controversy: VAR has been criticised for lengthy delays, inconsistent application, and reducing the emotional impact of goals. Some argue it makes the game more "robotic." Supporters say it corrects major injustices and improves accuracy. The debate continues.`,
    keyConcepts: [
      { term: 'Four Categories', definition: 'VAR reviews: goals, penalty decisions, direct red cards, and mistaken identity only.' },
      { term: 'Clear and Obvious Error', definition: 'VAR should only intervene when the original decision was clearly wrong.' },
      { term: 'On-Field Review (OFR)', definition: 'The referee watches replays on the pitchside monitor before making a decision.' },
      { term: 'Referee Has Final Say', definition: 'The on-field referee always makes the final decision, even after a VAR recommendation.' },
      { term: 'SAOT', definition: 'Semi-Automated Offside Technology tracks 29 body points per player for precise offside calls.' },
      { term: 'TV Screen Gesture', definition: 'The referee draws a rectangle in the air to signal a VAR review.' },
    ],
    tags: ['VAR', 'video assistant referee', 'review', 'pitchside monitor', 'SAOT', 'technology'],
  },
  {
    title: 'The Handball Rule Explained',
    slug: 'handball-rule-explained',
    category: 'var',
    difficulty: 'intermediate',
    summary: 'The modern handball rule distinguishes between deliberate and accidental handling, with special attention to "unnatural position" and scoring.',
    explanation: `The handball rule has been one of the most revised and debated laws in modern football. Here is the current interpretation:

A HANDBALL OFFENCE occurs when a player:

1. Deliberately touches the ball with their hand or arm — this includes moving the hand/arm towards the ball

2. Touches the ball with their hand/arm when it has made their body unnaturally bigger. "Unnaturally bigger" means the hand/arm is in a position that is not a consequence of the player's body movement for that specific situation. For example, having arms spread wide when jumping or sliding is considered unnatural.

3. Scores in the opponents' goal directly from their hand/arm, even if accidental — OR immediately creates a goal-scoring opportunity after the ball touches their hand/arm accidentally

The BOUNDARY of the arm for handball purposes is the bottom of the armpit. The shoulder is NOT part of the arm — a ball hitting the shoulder is not handball.

When it is NOT handball:
- The ball hits the hand/arm directly from the player's own head, body, or foot, or the head, body, or foot of another player who is close
- The hand/arm is close to the body and does not make the body unnaturally bigger
- The player falls and the hand/arm is between the body and the ground to support the player (but not extended laterally or vertically)

ACCIDENTAL handball by an attacker is now treated differently: if a player accidentally handles the ball and then scores, or a teammate scores shortly after, the goal is disallowed. But if the ball bounces off an attacker's arm and a different attacking move leads to a goal much later, the goal can stand.

Goalkeeper Handling Outside the Area: If a goalkeeper handles the ball outside their penalty area, it is treated the same as any other player — a direct free kick is awarded (and possibly a yellow or red card depending on the situation).

IFAB (International Football Association Board) has revised the handball law multiple times in recent years, trying to find a balance between penalising deliberate handling and not punishing players for unavoidable, accidental contact.`,
    keyConcepts: [
      { term: 'Deliberate Handling', definition: 'Moving the hand/arm towards the ball to make contact — always an offence.' },
      { term: 'Unnatural Position', definition: 'Hand/arm making the body unnaturally bigger — considered handball even if unintentional.' },
      { term: 'Arm Boundary', definition: 'The bottom of the armpit defines where the arm begins. Shoulder contact is NOT handball.' },
      { term: 'Scoring by Hand', definition: 'A goal scored directly or immediately after accidental handball is always disallowed.' },
      { term: 'Support Hand', definition: 'A hand/arm used to support the body when falling is usually NOT penalised.' },
    ],
    tags: ['handball', 'hand ball', 'arm', 'unnatural position', 'deliberate', 'accidental'],
  },
  {
    title: 'IFAB Rule Changes 2025/26 Season',
    slug: 'ifab-rule-changes-2025-26',
    category: 'var',
    difficulty: 'advanced',
    summary: 'Key rule changes and clarifications introduced by IFAB for the 2025/26 season, including updates to timekeeping and substitutions.',
    explanation: `The International Football Association Board (IFAB) meets annually to review and update the Laws of the Game. Here are the key changes and developments relevant to the 2025/26 season:

EFFECTIVE PLAYING TIME TRIALS: IFAB has been trialling a system where the clock stops whenever the ball is out of play, meaning each half would have exactly 30 minutes of "effective" playing time rather than 45 minutes with added time. While not yet universally adopted, trials have taken place in youth competitions and some leagues. The aim is to reduce time-wasting and ensure more actual football.

PERMANENT CONCUSSION SUBSTITUTIONS: Most top competitions now allow an additional substitution specifically for concussion incidents. This does not count towards the team's regular 5 substitutions. The player with a suspected concussion must leave and cannot return.

BLUE CARDS (Trials): IFAB has been testing "blue cards" in some lower-level competitions. A blue card would send a player to a "sin bin" for 10 minutes (similar to rugby) for offences like dissent, tactical fouls, or deliberate handball. The player returns after 10 minutes. This has NOT been implemented in top-level professional football and remains in trial phase.

GOALKEEPER DISTRIBUTION: Clarifications around goalkeeper distribution — the goalkeeper must release the ball within a reasonable time (approximately 6 seconds) and cannot bounce the ball, throw it in the air, and catch it repeatedly to waste time. Referees are being instructed to enforce this more strictly.

CAPTAIN ONLY APPROACH: Only team captains are permitted to approach the referee to discuss decisions. Other players who approach or surround the referee risk a yellow card. This rule, trialled at Euro 2024, has been widely adopted and aims to reduce referee intimidation and improve match flow.

HANDBALL CLARIFICATION: Further refinement of when accidental handball by an attacker should be penalised. The emphasis is on whether the hand/arm was in a natural position relative to the player's movement, with less focus on the "gaining an advantage" aspect.

KICK-OFF CHANGES: Players at kick-off are no longer required to kick the ball forward — it can be kicked in any direction. The ball is in play when it is kicked and clearly moves.

These rules continue to evolve. IFAB's stated goal is to make football more fair, attractive, and consistent across all levels of the game.`,
    keyConcepts: [
      { term: 'Effective Playing Time', definition: 'Trial system where the clock stops when the ball is out of play — each half is 30 minutes of actual play.' },
      { term: 'Concussion Substitution', definition: 'An additional sub allowed for concussion incidents, not counted in the regular 5.' },
      { term: 'Blue Card (Trial)', definition: '10-minute "sin bin" for dissent, tactical fouls, etc. — being tested in lower leagues only.' },
      { term: 'Captain Only', definition: 'Only team captains can approach the referee to discuss decisions.' },
      { term: 'Kick-off Direction', definition: 'The ball can now be kicked in any direction at kick-off, not just forward.' },
    ],
    tags: ['IFAB', 'rule changes', '2025-26', 'blue card', 'concussion', 'effective playing time', 'captain'],
  },
];

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key') || authHeader?.replace('Bearer ', '');

  if (key !== CRON_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let inserted = 0;
    let skipped = 0;

    for (const law of laws) {
      // Check if already exists by slug
      const existing = await db
        .select({ id: tacticalAnalysis.id })
        .from(tacticalAnalysis)
        .where(eq(tacticalAnalysis.slug, law.slug))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(tacticalAnalysis).values({
        title: law.title,
        slug: law.slug,
        category: law.category,
        difficulty: law.difficulty,
        summary: law.summary,
        explanation: law.explanation,
        keyConcepts: law.keyConcepts,
        isPublished: true,
        tags: law.tags,
      });

      inserted++;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      total: laws.length,
    });
  } catch (error: any) {
    console.error('Seed rules error:', error);
    return NextResponse.json(
      { error: 'Failed to seed rules', details: error.message },
      { status: 500 }
    );
  }
}
