from django.core.management.base import BaseCommand

from gamedata.models import Game, GameEdition


class Command(BaseCommand):
    help = "Creates the Horus Heresy System"

    def handle(self, *args, **options):
        print("Creating the Horus Heresy System")

        hh, _ = Game.objects.get_or_create(name="Warhammer: The Horus Heresy")
        first_ed, _ = GameEdition.objects.get_or_create(game=hh, release_year=2012)
        second_ed, _ = GameEdition.objects.get_or_create(game=hh, release_year=2022)


