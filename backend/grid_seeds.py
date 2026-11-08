"""
Known films used only to avoid generating impossible grid intersections.
"""

RDJ = "Robert Downey Jr."
HANKS = "Tom Hanks"
LEO = "Leonardo DiCaprio"
SCARLETT = "Scarlett Johansson"
BALE = "Christian Bale"
PITT = "Brad Pitt"
DENZEL = "Denzel Washington"

NOLAN = "Christopher Nolan"
SCORSESE = "Martin Scorsese"
CAMERON = "James Cameron"
ZEMECKIS = "Robert Zemeckis"
VILLENEUVE = "Denis Villeneuve"
GERWIG = "Greta Gerwig"

# Title, release year, selected cast, selected directors, selected TMDB genre IDs.
SEED_MOVIES = [
  ("Iron Man", 2008, (RDJ,), (), (28, 878)),
  ("Iron Man 2", 2010, (RDJ, SCARLETT), (), (28, 878)),
  ("Iron Man 3", 2013, (RDJ,), (), (28, 878)),
  ("Sherlock Holmes", 2009, (RDJ,), (), (28,)),
  ("The Avengers", 2012, (RDJ, SCARLETT), (), (28, 878)),
  ("Avengers: Age of Ultron", 2015, (RDJ, SCARLETT), (), (28, 878)),
  ("Avengers: Infinity War", 2018, (RDJ, SCARLETT), (), (28, 878)),
  ("Avengers: Endgame", 2019, (RDJ, SCARLETT), (), (28, 878)),
  ("Oppenheimer", 2023, (RDJ,), (NOLAN,), (18,)),
  ("Titanic", 1997, (LEO,), (CAMERON,), (18,)),
  ("The Aviator", 2004, (LEO,), (SCORSESE,), (18,)),
  ("The Departed", 2006, (LEO,), (SCORSESE,), (18, 53)),
  ("Inception", 2010, (LEO,), (NOLAN,), (28, 878)),
  ("The Wolf of Wall Street", 2013, (LEO,), (SCORSESE,), (18, 35)),
  ("Shutter Island", 2010, (LEO,), (SCORSESE,), (18, 53)),
  ("Killers of the Flower Moon", 2023, (LEO,), (SCORSESE,), (18,)),
  ("Forrest Gump", 1994, (HANKS,), (ZEMECKIS,), (18, 35)),
  ("Cast Away", 2000, (HANKS,), (ZEMECKIS,), (18,)),
  ("The Terminal", 2004, (HANKS,), (), (18, 35)),
  ("Sully", 2016, (HANKS,), (), (18,)),
  ("A Man Called Otto", 2022, (HANKS,), (), (18, 35)),
  ("The Polar Express", 2004, (HANKS,), (ZEMECKIS,), ()),
  ("Lost in Translation", 2003, (SCARLETT,), (), (18, 35)),
  ("Lucy", 2014, (SCARLETT,), (), (28, 878)),
  ("Marriage Story", 2019, (SCARLETT,), (), (18,)),
  ("Black Widow", 2021, (SCARLETT,), (), (28, 878)),
  ("The Prestige", 2006, (BALE, SCARLETT), (NOLAN,), (18, 878, 53)),
  ("Batman Begins", 2005, (BALE,), (NOLAN,), (28, 18)),
  ("The Dark Knight", 2008, (BALE,), (NOLAN,), (28, 18, 53)),
  ("The Dark Knight Rises", 2012, (BALE,), (NOLAN,), (28, 18)),
  ("American Psycho", 2000, (BALE,), (), (18, 53)),
  ("Dunkirk", 2017, (), (NOLAN,), (28, 18)),
  ("Interstellar", 2014, (), (NOLAN,), (18, 878)),
  ("Tenet", 2020, (), (NOLAN,), (28, 878, 53)),
  ("Avatar", 2009, (), (CAMERON,), (28, 878)),
  ("Avatar: The Way of Water", 2022, (), (CAMERON,), (28, 878)),
  ("Terminator 2: Judgment Day", 1991, (), (CAMERON,), (28, 878, 53)),
  ("Arrival", 2016, (), (VILLENEUVE,), (18, 878)),
  ("Blade Runner 2049", 2017, (), (VILLENEUVE,), (18, 878)),
  ("Dune", 2021, (), (VILLENEUVE,), (878,)),
  ("Dune: Part Two", 2024, (), (VILLENEUVE,), (878,)),
  ("Sicario", 2015, (), (VILLENEUVE,), (28, 53)),
  ("Prisoners", 2013, (), (VILLENEUVE,), (18, 53)),
  ("Fight Club", 1999, (PITT,), (), (18,)),
  ("World War Z", 2013, (PITT,), (), (28, 53)),
  ("Once Upon a Time in Hollywood", 2019, (PITT,), (), (18, 35)),
  ("Bullet Train", 2022, (PITT,), (), (28, 35)),
  ("Crimson Tide", 1995, (DENZEL,), (), (28, 53)),
  ("Training Day", 2001, (DENZEL,), (), (18, 53)),
  ("Flight", 2012, (DENZEL,), (ZEMECKIS,), (18,)),
  ("Fences", 2016, (DENZEL,), (), (18,)),
  ("The Equalizer 3", 2023, (DENZEL,), (), (28, 53)),
  ("Back to the Future", 1985, (), (ZEMECKIS,), (35, 878)),
  ("Barbie", 2023, (), (GERWIG,), (35,)),
  ("Lady Bird", 2017, (), (GERWIG,), (18, 35)),
  ("Little Women", 2019, (), (GERWIG,), (18,)),
]
