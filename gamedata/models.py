from datetime import datetime

from django.db import models


# Create your models here

class Game(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class GameEdition(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    edition_name = models.CharField(max_length=100, blank=True, null=True)
    release_year = models.PositiveIntegerField()

    def __str__(self):
        if self.edition_name:
            return f"{self.game} {self.edition_name}"
        else:
            return f"{self.game} ({self.release_year})"


class BuilderModel(models.Model):
    builder_id = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        abstract = True


class GameCharacteristic(BuilderModel):
    edition = models.ForeignKey(GameEdition, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.name} from {self.edition}"


class ProfileType(BuilderModel):
    edition = models.ForeignKey(GameEdition, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.edition})"


class Profile(BuilderModel):
    version_date = models.DateTimeField(default=datetime.now)
    edition = models.ForeignKey(GameEdition, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    type = models.ForeignKey(ProfileType, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.type}) from "


class Characteristic(BuilderModel):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    characteristic = models.ForeignKey(GameCharacteristic, on_delete=models.CASCADE)
    value_text = models.CharField(max_length=240, blank=True, null=True)

    def __str__(self):
        return f"{self.characteristic} {self.value_text} from {self.profile}"
